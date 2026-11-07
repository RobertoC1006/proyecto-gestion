import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ format: 'email', maxLength: 254 }) email!: string;
  @ApiProperty({ format: 'password', minLength: 1, maxLength: 128, writeOnly: true }) password!: string;
}
export class RegisterDto extends LoginDto {
  @ApiProperty({ format: 'password', minLength: 10, maxLength: 128, writeOnly: true }) declare password: string;
  @ApiProperty({ minLength: 2, maxLength: 120 }) displayName!: string;
}
export class EmailDto { @ApiProperty({ format: 'email' }) email!: string; }
export class PasswordDto {
  @ApiProperty({ format: 'password', minLength: 10, maxLength: 128, writeOnly: true }) password!: string;
}
export class RecoveryStatusDto {
  @ApiProperty() csrfToken!: string;
}
export class CurrentUserDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) institutionId!: string;
  @ApiProperty() email!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: ['estudiante', 'docente', 'ti_agente', 'ti_supervisor', 'administrador'] }) role!: string;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' }) teamId!: string | null;
  @ApiProperty() active!: boolean;
  @ApiProperty({ type: [String] }) permissions!: readonly string[];
}
export class SessionDto {
  @ApiProperty({ type: CurrentUserDto }) user!: CurrentUserDto;
  @ApiProperty({ description: 'Solo protección CSRF; no es token de Supabase ni credencial de sesión.' }) csrfToken!: string;
}
export class AuthStatusDto {
  @ApiProperty() available!: boolean;
  @ApiProperty() registrationEnabled!: boolean;
  @ApiProperty() emailLinksRequired!: boolean;
}
export class AuthMessageDto {
  @ApiProperty() message!: string;
  @ApiPropertyOptional() providerRevoked?: boolean;
}
