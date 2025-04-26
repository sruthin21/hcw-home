import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ReminderService } from './reminder.service';
import { ReminderProcessor } from './reminder.processor';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    BullModule.registerQueue({
      name: 'reminders',
    }),
  ],
  providers: [ReminderService, ReminderProcessor],
  exports: [ReminderService],
})
export class ReminderModule {}