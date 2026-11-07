import { Injectable } from '@nestjs/common';
import { AcademicDirectory, AcademicIdentity, AcademicRequest } from './academic.access';
import { AuthRequest, AuthService } from '../auth/auth.service';
import { IdentityDirectory } from '../auth/auth.directory';

@Injectable()
export class SessionAcademicIdentity extends AcademicIdentity {
  constructor(private readonly auth: AuthService) { super(); }
  resolve(request: AcademicRequest) { return this.auth.resolve(request as AuthRequest); }
}
@Injectable()
export class CanonicalAcademicDirectory extends AcademicDirectory {
  constructor(private readonly directory: IdentityDirectory) { super(); }
  belongsToInstitution(id: string, institution: string) { return this.directory.belongsToInstitution(id, institution); }
}
