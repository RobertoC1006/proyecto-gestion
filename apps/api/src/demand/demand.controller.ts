import { Body, Controller, Get, Header, Post, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CampusSessionGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth.service';
import { DemandService } from './demand.service';
import { DemandJobs } from './demand.jobs';
@ApiTags('Demanda y evaluación') @ApiCookieAuth('campus_session')
@UseGuards(CampusSessionGuard)
@Controller('demand')
export class DemandController {
 constructor(private readonly demand:DemandService,private readonly jobs:DemandJobs){}
 @Get() snapshot(@Req()r:AuthRequest,@Query()q:unknown){return this.demand.snapshot(r.campusPrincipal!,q)}
 @Get('config') config(@Req()r:AuthRequest){return this.demand.config(r.campusPrincipal!)}
 @Patch('config') async save(@Req()r:AuthRequest,@Body()b:unknown){const config=await this.demand.saveConfig(r.campusPrincipal!,b);await this.jobs.refreshAlerts(r.campusPrincipal!.institutionId);return config}
 @Post('runs') async run(@Req()r:AuthRequest,@Body()b:unknown){const run=await this.demand.queue(r.campusPrincipal!,b);await this.jobs.dispatch();return {id:run.id,status:run.status}}
}
