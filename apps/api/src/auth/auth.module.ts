import { Module } from '@nestjs/common';
import { AuthConfig } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthProvider, SupabaseAuthProvider } from './auth.provider';
import { IdentityDirectory } from './auth.directory';
import { CampusSessionGuard } from './auth.guard';
import { RolePermissionsService } from './role-permissions.service';
import { RolePermissionsController } from './role-permissions.controller';

@Module({ controllers: [AuthController, RolePermissionsController], providers: [AuthConfig, AuthService, IdentityDirectory, RolePermissionsService, CampusSessionGuard,
  { provide: AuthProvider, useClass: SupabaseAuthProvider }],
  exports: [AuthService, IdentityDirectory, RolePermissionsService, CampusSessionGuard] })
export class AuthModule {}
