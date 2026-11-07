import { Module } from '@nestjs/common';
import { AuthConfig } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthProvider, SupabaseAuthProvider } from './auth.provider';
import { IdentityDirectory } from './auth.directory';
import { CampusSessionGuard } from './auth.guard';

@Module({ controllers: [AuthController], providers: [AuthConfig, AuthService, IdentityDirectory, CampusSessionGuard,
  { provide: AuthProvider, useClass: SupabaseAuthProvider }],
  exports: [AuthService, IdentityDirectory, CampusSessionGuard] })
export class AuthModule {}
