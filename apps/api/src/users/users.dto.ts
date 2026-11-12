import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampusRole } from '@prisma/client';

export class SupportTeamItemDto {
  @ApiProperty({ type: String, format: 'uuid', example: 'd3b07384-d113-494b-9c8e-aa7f4e912345' })
  id!: string;

  @ApiProperty({ type: String, example: 'TI-MESA' })
  code!: string;

  @ApiProperty({ type: String, example: 'Mesa de Ayuda Presencial' })
  name!: string;
}

export class UserItemDto {
  @ApiProperty({ type: String, format: 'uuid', example: 'e2b17384-d113-494b-9c8e-aa7f4e912345' })
  id!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  institutionId!: string;

  @ApiProperty({ type: String, example: 'estudiante@tallan.edu.pe' })
  email!: string;

  @ApiProperty({ type: String, example: 'Ana Torres' })
  displayName!: string;

  @ApiProperty({ enum: CampusRole, example: 'estudiante' })
  role!: CampusRole;

  @ApiProperty({ type: Boolean, example: true })
  active!: boolean;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, example: null })
  teamId!: string | null;

  @ApiProperty({ type: SupportTeamItemDto, nullable: true })
  team!: SupportTeamItemDto | null;

  @ApiProperty({ type: Number, example: 1 })
  accessVersion!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class UsersPageDto {
  @ApiProperty({ type: [UserItemDto] })
  items!: UserItemDto[];

  @ApiProperty({ type: Number, example: 25 })
  total!: number;

  @ApiProperty({ type: Number, example: 1 })
  page!: number;

  @ApiProperty({ type: Number, example: 20 })
  pageSize!: number;
}

export class UsersQueryDto {
  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 100000, default: 1 })
  page?: number;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 100, default: 20 })
  pageSize?: number;

  @ApiPropertyOptional({ enum: CampusRole })
  role?: CampusRole;

  @ApiPropertyOptional({ type: Boolean })
  active?: boolean;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  teamId?: string;

  @ApiPropertyOptional({ type: String, maxLength: 100, description: 'Búsqueda por nombre o correo' })
  search?: string;
}

export class UpdateUserAccessDto {
  @ApiProperty({ enum: CampusRole, example: 'docente' })
  role!: CampusRole;

  @ApiProperty({ type: Boolean, example: true })
  active!: boolean;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    example: null,
    description: 'UUID del equipo de soporte asignado, o null si no se asigna equipo.',
  })
  teamId!: string | null;

  @ApiProperty({
    type: String,
    minLength: 5,
    maxLength: 500,
    example: 'Asignación de rol docente para el periodo 2026-II.',
  })
  reason!: string;

  @ApiProperty({
    type: Number,
    minimum: 1,
    example: 1,
    description: 'Versión actual del acceso (control de concurrencia optimista)',
  })
  expectedVersion!: number;
}
