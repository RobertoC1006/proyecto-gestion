import { ApiProperty } from '@nestjs/swagger';
import { CertificateVerificationResult, TicketService } from '@prisma/client';

export class CertificateDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ format: 'uuid' }) ticketId!: string;
  @ApiProperty() ticketCode!: string;
  @ApiProperty({ enum: TicketService }) service!: TicketService;
  @ApiProperty({ format: 'date-time' }) resolvedAt!: string;
  @ApiProperty({ format: 'date-time' }) issuedAt!: string;
  @ApiProperty() sha256!: string;
  @ApiProperty({ enum: ['emitida'] }) status!: 'emitida';
}

export class CertificateEligibilityDto {
  @ApiProperty({ format: 'uuid' }) ticketId!: string;
  @ApiProperty() ticketCode!: string;
  @ApiProperty({ enum: TicketService }) service!: TicketService;
  @ApiProperty({ format: 'date-time' }) resolvedAt!: string;
  @ApiProperty() eligible!: true;
  @ApiProperty({ type: CertificateDto, nullable: true }) certificate!: CertificateDto | null;
}

export class CertificatesPageDto {
  @ApiProperty({ type: () => [CertificateEligibilityDto] }) eligible!: CertificateEligibilityDto[];
  @ApiProperty({ type: () => [CertificateDto] }) issued!: CertificateDto[];
}

export class CertificateAuditItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) certificateId!: string | null;
  @ApiProperty({ type: String, nullable: true }) ticketCode!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) actorId!: string | null;
  @ApiProperty({ enum: CertificateVerificationResult }) action!: CertificateVerificationResult;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
}

export class CertificateAuditPageDto {
  @ApiProperty({ type: () => [CertificateAuditItemDto] }) items!: CertificateAuditItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
