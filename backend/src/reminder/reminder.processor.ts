import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReminderService } from './reminder.service';
import { ReminderType } from '@prisma/client';

@Processor('reminders')
export class ReminderProcessor {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(private reminderService: ReminderService) {}

  @Process('send-reminder')
  async handleSendReminder(job: Job<{ consultationId: number; reminderType: ReminderType }>): Promise<void> {
    this.logger.debug(`Processing job ${job.id} for consultation ${job.data.consultationId}`);
    
    try {
      await this.reminderService.processReminder(
        job.data.consultationId,
        job.data.reminderType,
      );
      
      this.logger.log(`Successfully processed reminder for consultation ${job.data.consultationId}`);
    } catch (error) {
      this.logger.error(`Failed to process reminder for consultation ${job.data.consultationId}: ${error.message}`);
      throw error; // Rethrow to trigger Bull's retry mechanism
    }
  }
}