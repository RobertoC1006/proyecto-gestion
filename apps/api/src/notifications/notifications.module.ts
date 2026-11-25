import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsService } from './notifications.service';
import { AlertsController, NotificationsController } from './notifications.controller';
@Module({imports:[AuthModule],controllers:[NotificationsController,AlertsController],providers:[NotificationsService],exports:[NotificationsService]})
export class NotificationsModule{}
