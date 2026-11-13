import { DemoService } from './demo.service';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { AcademicModule } from '../academic/academic.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({ imports: [AuthModule, AcademicModule], controllers: [TicketsController, OperationsController], providers: [TicketsService, OperationsService, DemoService] })
export class TicketsModule {}
