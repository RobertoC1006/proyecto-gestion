import { Module } from '@nestjs/common';
import { AcademicController, PersonalAcademicController } from './academic.controller';
import { AcademicDirectory, AcademicIdentity, AcademicSessionGuard } from './academic.access';
import { AuthModule } from '../auth/auth.module';
import { SessionAcademicIdentity, CanonicalAcademicDirectory } from './academic.identity';
import { AcademicService } from './academic.service';

@Module({ imports: [AuthModule], controllers: [AcademicController, PersonalAcademicController],
  providers: [AcademicService, AcademicSessionGuard,
    { provide: AcademicIdentity, useClass: SessionAcademicIdentity },
    { provide: AcademicDirectory, useClass: CanonicalAcademicDirectory }],
  exports: [AcademicService, AcademicIdentity, AcademicDirectory] })
export class AcademicModule {}
