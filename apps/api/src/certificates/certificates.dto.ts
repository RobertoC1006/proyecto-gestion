import { ApiProperty } from '@nestjs/swagger';
import { TicketService } from '@prisma/client';

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
