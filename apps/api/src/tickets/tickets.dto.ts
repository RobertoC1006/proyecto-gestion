import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketScope, TicketService, TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ minLength: 20, maxLength: 5000 }) description!: string;
  @ApiProperty({ enum: TicketService }) service!: TicketService;
  @ApiProperty({ enum: TicketScope }) scope!: TicketScope;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) courseId!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) sectionId!: string | null;
}
export class TicketsQueryDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 }) page?: number;
  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 20 }) pageSize?: number;
  @ApiPropertyOptional({ enum: TicketStatus }) status?: TicketStatus;
  @ApiPropertyOptional({ type: String, maxLength: 100 }) search?: string;
}
export class TicketDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: TicketService }) service!: TicketService;
  @ApiProperty({ enum: TicketScope }) scope!: TicketScope;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) courseId!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) sectionId!: string | null;
  @ApiProperty({ enum: TicketStatus }) status!: TicketStatus;
  @ApiProperty({ enum: ['pendiente'] }) classificationStatus!: 'pendiente';
  @ApiProperty({ type: String, nullable: true, example: null }) priority!: null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}
export class TicketPageDto {
  @ApiProperty({ type: () => [TicketDto] }) items!: TicketDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
export class TicketServiceDto {
  @ApiProperty({ enum: TicketService }) id!: TicketService;
  @ApiProperty() label!: string;
}
