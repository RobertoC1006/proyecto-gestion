import { ApiProperty } from '@nestjs/swagger';

export class ConsentVersionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() version!: string;
  @ApiProperty() title!: string;
  @ApiProperty() summary!: string;
  @ApiProperty({ format: 'date-time' }) effectiveAt!: string;
}

export class ConsentAcceptanceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty() version!: string;
  @ApiProperty({ format: 'date-time' }) acceptedAt!: string;
}

export class ConsentMeDto {
  @ApiProperty({ type: ConsentVersionDto, nullable: true }) current!: ConsentVersionDto | null;
  @ApiProperty({ type: ConsentAcceptanceDto, nullable: true }) acceptance!: ConsentAcceptanceDto | null;
}

export class ConsentAcceptDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador de la versión que el usuario vio.' })
  expectedVersionId!: string;
}

export class ConsentAcceptancePageDto {
  @ApiProperty({ type: [ConsentAcceptanceDto] }) items!: ConsentAcceptanceDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
