import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AcademicModule } from './academic/academic.module';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';

@Module({ imports: [DatabaseModule, HealthModule, AuthModule, AcademicModule, TicketsModule, UsersModule, ReportsModule] })
export class AppModule {}
