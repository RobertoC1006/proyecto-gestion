import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AcademicModule } from './academic/academic.module';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { ConsentModule } from './consent/consent.module';
import { AuditModule } from './audit/audit.module';

@Module({
    imports: [
        DatabaseModule,
        HealthModule,
        AuthModule,
        AcademicModule,
        TicketsModule,
        UsersModule,
        ConsentModule,
        AuditModule,
    ],
})
export class AppModule { }
