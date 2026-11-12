import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 }) page?: number;
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 }) pageSize?: number;
  @ApiPropertyOptional({ format: 'date-time' }) from?: string;
  @ApiPropertyOptional({ format: 'date-time' }) to?: string;
  @ApiPropertyOptional({ format: 'uuid' }) actorId?: string;
  @ApiPropertyOptional() objectType?: string;
  @ApiPropertyOptional({ format: 'uuid' }) objectId?: string;
  @ApiPropertyOptional() action?: string;
}

export class AuditItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
  @ApiProperty({ format: 'uuid' }) actorId!: string;
  @ApiProperty() actor!: string;
  @ApiProperty() action!: string;
  @ApiProperty() objectType!: string;
  @ApiProperty({ nullable: true, format: 'uuid' }) objectId!: string | null;
  @ApiProperty({ nullable: true }) reason!: string | null;
  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true }) before!: Record<string, unknown> | null;
  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true }) after!: Record<string, unknown> | null;
}

export class AuditPageDto {
  @ApiProperty({ type: [AuditItemDto] }) items!: AuditItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
