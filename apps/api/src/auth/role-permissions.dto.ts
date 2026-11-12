import { ApiProperty } from '@nestjs/swagger';
export class PermissionItemDto {
  @ApiProperty() key!: string;
  @ApiProperty() module!: string;
  @ApiProperty() label!: string;
  @ApiProperty({ enum: ['consultar', 'registrar', 'atender', 'asignar', 'administrar'] }) action!: string;
  @ApiProperty() scope!: string;
  @ApiProperty() available!: boolean;
}
export class RoleAccessDto {
  @ApiProperty({ enum: ['estudiante', 'docente', 'ti_agente', 'ti_supervisor', 'administrador'] }) role!: string;
  @ApiProperty() label!: string;
  @ApiProperty({ type: [String] }) permissions!: string[];
  @ApiProperty() version!: number;
  @ApiProperty({ nullable: true, type: String }) updatedAt!: string | null;
  @ApiProperty({ type: [String] }) allowedPermissions!: string[];
  @ApiProperty({ type: [String] }) protectedPermissions!: string[];
}
export class RoleMatrixDto {
  @ApiProperty({ type: [RoleAccessDto] }) roles!: RoleAccessDto[];
  @ApiProperty({ type: [PermissionItemDto] }) catalog!: PermissionItemDto[];
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) dependencies!: Record<string, string>;
}
export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [String] }) permissions!: string[];
  @ApiProperty({ minimum: 0 }) expectedVersion!: number;
  @ApiProperty({ minLength: 5, maxLength: 500 }) reason!: string;
}
