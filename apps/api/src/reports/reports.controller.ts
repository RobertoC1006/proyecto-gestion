import { Controller, Get, Header, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CampusSessionGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth.service';
import { ReportsDto, ReportFiltersDto } from './reports.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reportes operativos P15')
@ApiCookieAuth('campus_session')
@UseGuards(CampusSessionGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: ReportsDto })
  report(@Req() request: AuthRequest, @Query() query: ReportFiltersDto) {
    return this.reports.report(request.campusPrincipal!, query);
  }

  @Get('export')
  @Header('Cache-Control', 'no-store')
  async export(@Req() request: AuthRequest, @Query() query: ReportFiltersDto, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="campusitsm-reportes.csv"');
    return this.reports.export(request.campusPrincipal!, query);
  }
}
