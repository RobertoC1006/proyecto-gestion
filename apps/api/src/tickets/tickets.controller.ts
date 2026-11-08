import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCookieAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiHeader, ApiNotFoundResponse, ApiOkResponse, ApiServiceUnavailableResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthRequest } from '../auth/auth.service';
import { CampusSessionGuard, RequirePermissions } from '../auth/auth.guard';
import { CreateTicketDto, TicketDto, TicketPageDto, TicketServiceDto, TicketsQueryDto } from './tickets.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Incidencias — Semana 1')
@ApiCookieAuth('campus_session')
@ApiUnauthorizedResponse({ description: 'SESSION_REQUIRED' })
@ApiForbiddenResponse({ description: 'FORBIDDEN o WRITE_PROTECTION_REQUIRED' })
@ApiBadRequestResponse({ description: 'VALIDATION_ERROR' })
@UseGuards(CampusSessionGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}
  @Post()
  @RequirePermissions('tickets:create')
  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @ApiCreatedResponse({ type: TicketDto })
  @ApiOkResponse({ type: TicketDto, description: 'Reintento idéntico.' })
  @ApiConflictResponse({ description: 'IDEMPOTENCY_CONFLICT' })
  @ApiServiceUnavailableResponse({ description: 'DEPENDENCY_UNAVAILABLE' })
  async create(@Req() request: AuthRequest, @Body() body: CreateTicketDto,
    @Headers('idempotency-key') key: string, @Res({ passthrough: true }) reply: { status: (code: number) => unknown; setHeader: (name: string, value: string) => unknown }) {
    const result = await this.tickets.create(request.campusPrincipal!, body, key);
    reply.status(result.created ? 201 : 200);
    reply.setHeader('Location', `/api/v1/tickets/${result.ticket.id}`);
    return result.ticket;
  }
  @Get('services')
  @RequirePermissions('tickets:create')
  @ApiOkResponse({ type: [TicketServiceDto] })
  services() { return this.tickets.services(); }
  @Get()
  @RequirePermissions('tickets:read:self')
  @ApiOkResponse({ type: TicketPageDto })
  list(@Req() request: AuthRequest, @Query() query: TicketsQueryDto) {
    return this.tickets.list(request.campusPrincipal!, query);
  }
  @Get(':id')
  @RequirePermissions('tickets:read:self')
  @ApiOkResponse({ type: TicketDto })
  @ApiNotFoundResponse({ description: 'Ticket ajeno o inexistente.' })
  get(@Req() request: AuthRequest, @Param('id') id: string) {
    return this.tickets.get(request.campusPrincipal!, id);
  }
}
