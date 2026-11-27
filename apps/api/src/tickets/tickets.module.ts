import { DemoService } from './demo.service';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { AcademicModule } from '../academic/academic.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketAiService } from './ticket-ai.service';
import { TicketAttachmentController } from './ticket-attachment.controller';
import { TicketAttachmentService } from './ticket-attachment.service';
import { TicketAttachmentStorage } from './ticket-attachment.storage';

@Module({ imports: [AuthModule, AcademicModule], controllers: [TicketsController, OperationsController, TicketAttachmentController], providers: [TicketsService, OperationsService, TicketAiService, DemoService, TicketAttachmentService, TicketAttachmentStorage] })
export class TicketsModule {}
