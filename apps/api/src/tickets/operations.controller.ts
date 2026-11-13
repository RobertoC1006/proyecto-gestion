import { DemoService } from './demo.service';
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CampusSessionGuard, RequirePermissions } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth.service';
import { OperationsService } from './operations.service';

@ApiTags('Atención y prioridad contextual')
@ApiCookieAuth('campus_session')
@UseGuards(CampusSessionGuard)
@Controller('operations')
export class OperationsController {
 constructor(private readonly operations: OperationsService, private readonly demo: DemoService) {}
 @Post('demo') @RequirePermissions('configuration:manage')
 demoCase(@Req() r:AuthRequest,@Body() b:unknown) {return this.demo.prepare(r.campusPrincipal!,b);}
 @Get('policy') @RequirePermissions('configuration:manage')
 policy(@Req() r:AuthRequest) {return this.operations.policy(r.campusPrincipal!);}
 @Patch('policy') @RequirePermissions('configuration:manage')
 savePolicy(@Req() r:AuthRequest,@Body() b:unknown) {return this.operations.savePolicy(r.campusPrincipal!,b);}
 @Get('tickets') @RequirePermissions('tickets:read:institution')
 queue(@Req() r:AuthRequest,@Query() q:unknown) {return this.operations.queue(r.campusPrincipal!,q);}
 @Get('tickets/:id') @RequirePermissions('tickets:read:institution')
 detail(@Req() r:AuthRequest,@Param('id') id:string) {return this.operations.detail(r.campusPrincipal!,id);}
 @Patch('tickets/:id') @RequirePermissions('tickets:work:institution')
 action(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown) {return this.operations.action(r.campusPrincipal!,id,b);}
}
