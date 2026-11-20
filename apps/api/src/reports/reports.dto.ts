import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportFiltersDto {
  @ApiPropertyOptional({ format: 'date-time' }) from?: string;
  @ApiPropertyOptional({ format: 'date-time' }) to?: string;
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'] }) period?: 'day' | 'week' | 'month';
  @ApiPropertyOptional() service?: string;
  @ApiPropertyOptional({ enum: ['registrado', 'en_atencion', 'resuelto'] }) status?: string;
  @ApiPropertyOptional({ enum: ['institution', 'team'] }) scope?: 'institution' | 'team';
}

export class ReportSeriesDto {
  @ApiProperty() period!: string;
  @ApiProperty() observed!: number;
  @ApiProperty({ type: 'number', nullable: true }) forecast!: number | null;
}

export class ReportCategoryDto {
  @ApiProperty() service!: string;
  @ApiProperty() label!: string;
  @ApiProperty() count!: number;
  @ApiProperty({ nullable: true }) percentage!: number | null;
}

export class ReportsDto {
  @ApiProperty({ type: [ReportSeriesDto] }) series!: ReportSeriesDto[];
  @ApiProperty({ type: [ReportCategoryDto] }) categories!: ReportCategoryDto[];
  @ApiProperty() total!: number;
  @ApiProperty() registered!: number;
  @ApiProperty() inAttention!: number;
  @ApiProperty() resolved!: number;
  @ApiProperty({ nullable: true }) resolutionRate!: number | null;
  @ApiProperty({ nullable: true }) resolvedWithinSlaRate!: number | null;
  @ApiProperty() source!: 'tickets-operational';
  @ApiProperty() synthetic!: false;
  @ApiProperty({ enum: ['unavailable'] }) forecastStatus!: 'unavailable';
  @ApiProperty() forecastMessage!: string;
  @ApiProperty() filters!: ReportFiltersDto;
}
