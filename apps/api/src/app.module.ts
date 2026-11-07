import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AcademicModule } from './academic/academic.module';

@Module({ imports: [DatabaseModule, HealthModule, AcademicModule] })
export class AppModule {}
