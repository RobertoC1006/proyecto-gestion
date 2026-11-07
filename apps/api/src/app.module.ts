import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AcademicModule } from './academic/academic.module';
import { AuthModule } from './auth/auth.module';

@Module({ imports: [DatabaseModule, HealthModule, AuthModule, AcademicModule] })
export class AppModule {}
