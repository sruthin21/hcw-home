import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ConsultationStatus } from '@prisma/client';
import { ReminderService } from 'src/reminder/reminder.service';

@Injectable()
export class ConsultationService {
    constructor(
        private readonly db: DatabaseService,
        private reminderService: ReminderService,
    ) { }

    /**
     * Marks a consultation as WAITING when a patient hits the magic‑link.
     *
     * @param consultationId
     * @param patientId
     * @returns An object telling the success and the consulation Id
     * @throws NotFoundException if the consultation doesn't exist
    */
    async createConsultation(consultationData: any): Promise<any> {
        // pull out participants so we can wrap them in a `create` object
        const { participants = [], ...rest } = consultationData;
        console.log("from createConsultation");
        const consultation = await this.db.consultation.create({
          data: {
            ...rest,
            participants: {
              create: participants.map((p: any) => ({
                userId:   p.userId,
                isActive: p.isActive ?? false,
                joinedAt: p.joinedAt ? new Date(p.joinedAt) : undefined,
              })),
            },
          },
        });
    
        // Schedule reminders if consultation has a scheduled date
        if (consultation.scheduledDate) {
          await this.reminderService.scheduleReminders(consultation);
        }
    
        return consultation;
      }
    
    
      async updateConsultation(id: number, updateData: any): Promise<any> {
        // If callers might try to update participants here, you’d
        // need a similar nested‐write for participants as above.
        const { participants, ...rest } = updateData;
    
        const consultation = await this.db.consultation.update({
          where: { id },
          data: {
            ...rest,
            ...(participants
              ? {
                  participants: {
                    // for an update you might prefer createMany, connect, upsert, etc.
                    create: participants.map((p: any) => ({
                      userId:   p.userId,
                      isActive: p.isActive ?? false,
                      joinedAt: p.joinedAt ? new Date(p.joinedAt) : undefined,
                    })),
                  },
                }
              : {}),
          },
        });
    
        // If the scheduled date was updated, update the reminders as well
        if (updateData.scheduledDate) {
          await this.reminderService.scheduleReminders(consultation);
        }
    
        return consultation;
      }
    
    
      async cancelConsultation(id: number): Promise<any> {
        const consultation = await this.db.consultation.update({
          where: { id },
          data: { status: ConsultationStatus.CANCELLED },
        });
        
        // Cancel any pending reminders
        await this.reminderService.cancelExistingReminders(id);
        
        return consultation;
      }
    
      async getConsultationHistory(
        practitionerId: number,
        page: number = 1,
        limit: number = 10,
        search?: string,
        startDate?: Date,
        endDate?: Date,
      ): Promise<{ consultations: any[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        
        // Build the where clause
        const where: any = {
          participants: {
            some: {
              userId: practitionerId,
              user: {
                role: 'Practitioner',
              },
            },
          },
          status: {
            in: ['COMPLETED', 'CANCELLED'],
          },
        };
        
        // Add date filters if provided
        if (startDate || endDate) {
          where.scheduledDate = {};
          if (startDate) where.scheduledDate.gte = startDate;
          if (endDate) where.scheduledDate.lte = endDate;
        }
        
        // Add search filter if provided
        if (search) {
          where.participants = {
            some: {
              user: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                ],
                role: 'Patient',
              },
            },
          };
        }
        
        // Get the total count
        const total = await this.db.consultation.count({ where });
        
        // Get the consultations
        const consultations = await this.db.consultation.findMany({
          where,
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
          orderBy: {
            scheduledDate: 'desc',
          },
          skip,
          take: limit,
        });
        
        return {
          consultations,
          total,
          page,
          limit,
        };
      }

    async joinAsPatient(consultationId: number, patientId: number) {
        const consultation = await this.db.consultation.findUnique({ where: { id: consultationId } });
        if (!consultation) throw new NotFoundException('Consultation not found');

        const patient = await this.db.user.findUnique({ where: { id: patientId } });
        if (!patient) throw new NotFoundException('Patient does not exist');


        await this.db.participant.upsert({
            where: { consultationId_userId: { consultationId, userId: patientId } },
            create: { consultationId, userId: patientId, isActive: true, joinedAt: new Date() },
            update: { joinedAt: new Date() },
        });

        if (consultation.status === ConsultationStatus.SCHEDULED) {
            await this.db.consultation.update({
                where: { id: consultationId },
                data: { status: ConsultationStatus.WAITING },
            });
        }

        return { success: true, consultationId };
    }


    /**
     * Marks a consultation as ACTIVE when the practitioner joins.
     *
     * @param consultationId
     * @param practitionerId
     * @returns An object telling the success and the consulation Id
     * @throws NotFoundException if the consultation doesn't exist
     * @throws ForbiddenException if the user is not the owner
    */
    async joinAsPractitioner(consultationId: number, practitionerId: number) {
        const consultation = await this.db.consultation.findUnique({ where: { id: consultationId } });
        if (!consultation) throw new NotFoundException('Consultation not found');

        const practitioner = await this.db.user.findUnique({ where: { id: practitionerId } });
        if (!practitioner) throw new NotFoundException('Practitioner does not exist');

        if (consultation.owner !== practitionerId) {
            throw new ForbiddenException('Not the practitioner for this consultation');
        }

        await this.db.participant.upsert({
            where: { consultationId_userId: { consultationId, userId: practitionerId } },
            create: { consultationId, userId: practitionerId, isActive: true, joinedAt: new Date() },
            update: { joinedAt: new Date() },
        });

        await this.db.consultation.update({
            where: { id: consultationId },
            data: { status: ConsultationStatus.ACTIVE },
        });

        return { success: true, consultationId };
    }

    /**
     * Fetches all consultations in WAITING for a practitioner,
     * where patient has joined (isActive=true) but practitioner has not.
    */
    async getWaitingRoomConsultations(practitionerId: number) {
        return this.db.consultation.findMany({
            where: {
                status: ConsultationStatus.WAITING,
                owner: practitionerId,
                participants: {
                    some: {
                        isActive: true,
                        user: { role: 'Patient' },
                    },
                },
                NOT: {
                    participants: {
                        some: {
                            isActive: true,
                            user: { role: 'Practitioner' },
                        },
                    },
                },
            },
            select: {
                id: true,
                scheduledDate: true,
                participants: {
                    where: {
                        isActive: true,
                        user: { role: 'Patient' },
                    },
                    select: {
                        joinedAt: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                country: true, // placeholder for language
                            },
                        },
                    },
                },
            },
            orderBy: { scheduledDate: 'asc' },
        });
    }
}
