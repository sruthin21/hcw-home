import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { Consultation, MessageService, ReminderStatus, ReminderType } from '@prisma/client';
import { Twilio } from 'twilio';
@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectQueue('reminders') private reminderQueue: Queue,
    private databaseService: DatabaseService,
    private configService: ConfigService,
  ) {}
  


  async scheduleReminders(consultation: Consultation): Promise<void> {
    if (!consultation.scheduledDate) {
      this.logger.warn(`Consultation ${consultation.id} has no scheduled date, skipping reminders`);
      return;
    }
        // Cancel any existing reminders for this consultation
        await this.cancelExistingReminders(consultation.id);

        const scheduledDate = new Date(consultation.scheduledDate);
        const now = new Date();
        
        const dayBefore = new Date(scheduledDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        await this.createReminderRecord(consultation.id, ReminderType.DAY_BEFORE, dayBefore);
        await this.scheduleReminderJob(consultation.id, ReminderType.DAY_BEFORE, dayBefore);
    
        // 1 h before
        const hourBefore = new Date(scheduledDate);
        hourBefore.setHours(hourBefore.getHours() - 1);
        await this.createReminderRecord(consultation.id, ReminderType.HOUR_BEFORE, hourBefore);
        await this.scheduleReminderJob(consultation.id, ReminderType.HOUR_BEFORE, hourBefore);
  }

  private async createReminderRecord(
    consultationId: number, 
    reminderType: ReminderType, 
    scheduledFor: Date
  ): Promise<void> {
    await this.databaseService.consultationReminder.create({
      data: {
        consultationId,
        reminderType,
        scheduledFor,
        status: ReminderStatus.PENDING,
        attempts: 0,
      },
    });
  }

  private async scheduleReminderJob(
    consultationId: number, 
    reminderType: ReminderType, 
    scheduledFor: Date
  ): Promise<void> {
    const delay = scheduledFor.getTime() - Date.now();
    console.log("scheduleReminderJob");
    if (delay <= 0) {
      console.log(delay);
      this.logger.warn(`Reminder time for consultation ${consultationId} is in the past, processing immediately`);
      await this.processReminder(consultationId, reminderType);
      return;
    }
    
    await this.reminderQueue.add(
      'send-reminder',
      {
        consultationId,
        reminderType,
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
      },
    );
    
    this.logger.log(`Scheduled ${reminderType} reminder for consultation ${consultationId} at ${scheduledFor}`);
  }
  
  async cancelExistingReminders(consultationId: number): Promise<void> {
    // Mark existing reminders as cancelled in the database
    await this.databaseService.consultationReminder.updateMany({
      where: {
        consultationId,
        status: ReminderStatus.PENDING,
      },
      data: {
        status: ReminderStatus.CANCELLED,
      },
    });
    
    // Remove pending jobs from the queue
    const jobs = await this.reminderQueue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      const data = job.data;
      if (data && data.consultationId === consultationId) {
        await job.remove();
        this.logger.log(`Cancelled reminder job for consultation ${consultationId}`);
      }
    }
  }

  async processReminder(consultationId: number, reminderType: ReminderType): Promise<void> {
    this.logger.log(`Processing ${reminderType} reminder for consultation ${consultationId}`);
    console.log("processReminder");
    try {
      // Get the consultation with participants
      const consultation = await this.databaseService.consultation.findUnique({
        where: { id: consultationId },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
      
      if (!consultation) {
        this.logger.error(`Consultation ${consultationId} not found`);
        return;
      }
      
      if (consultation.status !== 'SCHEDULED') {
        this.logger.warn(`Consultation ${consultationId} is no longer scheduled (status: ${consultation.status}), skipping reminder`);
        await this.markReminderStatus(consultationId, reminderType, ReminderStatus.CANCELLED);
        return;
      }
      
      // Send reminders to all participants
      for (const participant of consultation.participants) {
        await this.sendReminderToParticipant(
          consultation,
          reminderType,
          participant.user,
        );
      }
      
      // Mark reminder as sent
      await this.markReminderStatus(consultationId, reminderType, ReminderStatus.SENT);
      
    } catch (error) {
      this.logger.error(`Error processing reminder for consultation ${consultationId}: ${error.message}`);
      await this.markReminderStatus(consultationId, reminderType, ReminderStatus.FAILED);
      throw error; // Allow Bull to retry
    }
  }
  
  private async markReminderStatus(
    consultationId: number, 
    reminderType: ReminderType, 
    status: ReminderStatus
  ): Promise<void> {
    await this.databaseService.consultationReminder.updateMany({
      where: {
        consultationId,
        reminderType,
        status: ReminderStatus.PENDING,
      },
      data: {
        status,
        sentAt: status === ReminderStatus.SENT ? new Date() : undefined,
        attempts: {
          increment: 1,
        },
      },
    });
  }
  
  private async sendReminderToParticipant(
    consultation: any,
    reminderType: ReminderType,
    user: any,
  ): Promise<void> {
    const messageService = consultation.messageService || MessageService.SMS;
    const template = this.getMessageTemplate(reminderType, user.language || 'en');
    const message = this.formatMessage(template, {
      name: `${user.firstName} ${user.lastName}`,
      date: new Date(consultation.scheduledDate).toLocaleDateString(user.language || 'en'),
      time: new Date(consultation.scheduledDate).toLocaleTimeString(user.language || 'en', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    });
    
    switch (messageService) {
      case MessageService.SMS:
        await this.sendSMS(user.phoneNumber, message);
        break;
      case MessageService.WHATSAPP:
        await this.sendWhatsApp(user.phoneNumber, message, consultation.whatsappTemplateId);
        break;
      default:
        this.logger.warn(`Unsupported message service: ${messageService}`);
        break;
    }
  }
  
  private getMessageTemplate(reminderType: ReminderType, language: string): string {
    const templates = {
      en: {
        [ReminderType.DAY_BEFORE]: "Reminder: You have a consultation scheduled for tomorrow at {{time}}.",
        [ReminderType.HOUR_BEFORE]: "Reminder: Your consultation is scheduled to begin in 1 hour at {{time}}.",
      },
      // Add other languages as needed
    };
    
    const langTemplates = templates[language] || templates.en;
    return langTemplates[reminderType];
  }
  
  private formatMessage(template: string, data: Record<string, string>): string {
    let message = template;
    for (const [key, value] of Object.entries(data)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return message;
  }
  
  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // Implementation using your SMS provider (e.g., Twilio)
    try {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      
      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio configuration missing');
      }
      
       const client = new Twilio(accountSid, authToken);
      await client.messages.create({
         from: fromNumber,
         to: phoneNumber,
         body: message
      });
      
      this.logger.log(`SMS sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Error sending SMS to ${phoneNumber}: ${error.message}`);
      throw error;
    }
  }
  
  private async sendWhatsApp(phoneNumber: string, message: string, templateId?: number): Promise<void> {
    // Implementation using your WhatsApp provider
    try {
      // Placeholder for WhatsApp integration
      this.logger.log(`WhatsApp message sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Error sending WhatsApp message to ${phoneNumber}: ${error.message}`);
      throw error;
    }
  }
}