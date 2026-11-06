import { Module } from '@nestjs/common';
import { AcademicController, PersonalAcademicController } from './academic.controller';
import { AcademicDirectory, AcademicIdentity, AcademicSessionGuard, UnavailableDirectory, UnavailableIdentity } from './academic.access';
import { AcademicService } from './academic.service';

@Module({ controllers: [AcademicController, PersonalAcademicController],
  providers: [AcademicService, AcademicSessionGuard,
    { provide: AcademicIdentity, useClass: UnavailableIdentity },
    { provide: AcademicDirectory, useClass: UnavailableDirectory }],
  exports: [AcademicService, AcademicIdentity, AcademicDirectory] })
export class AcademicModule {}
