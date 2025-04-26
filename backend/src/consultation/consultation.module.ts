import { Module } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { ConsultationController } from './consultation.controller';
import { ConsultationGateway } from './consultation.gateway';
import { DatabaseModule } from 'src/database/database.module';
import { ReminderModule } from 'src/reminder/reminder.module';

@Module({
  imports: [
    DatabaseModule,
    ReminderModule,
  ],
  providers: [ConsultationService, ConsultationGateway],
  controllers: [ConsultationController],
  exports: [ConsultationService],
})
export class ConsultationModule {}
