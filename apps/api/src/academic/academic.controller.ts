import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AcademicRequest, AcademicSessionGuard } from './academic.access';
import { AcademicService } from './academic.service';
import { CourseDto, CourseInputDto, CoursePageDto, DeletedDto, EventDeleteDto, EventDto, EventInputDto, EventPageDto, EventsQueryDto, EventUpdateDto, MembershipDto, PageQueryDto, ReasonDto, SectionDto, SectionInputDto, SectionPageDto, SectionQueryDto } from './academic.dto';

@ApiTags('Calendario académico — administración')
@ApiUnauthorizedResponse({ description: 'Sesión no disponible o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere administrador y protección de escritura.' })
@ApiBadRequestResponse({ description: 'VALIDATION_ERROR; fields contiene el error de cada campo.' })
@ApiNotFoundResponse({ description: 'Objeto no visible en la institución.' })
@ApiConflictResponse({ description: 'Código duplicado o versión desactualizada.' })
@UseGuards(AcademicSessionGuard)
@Controller('academic')
export class AcademicController {
  constructor(@Inject(AcademicService) private readonly academic: AcademicService) {}
  @Get('courses') @ApiOkResponse({ type: CoursePageDto })
  courses(@Req() r: AcademicRequest, @Query() q: PageQueryDto) { return this.academic.listCourses(r.academicPrincipal!, q); }
  @Post('courses') @ApiCreatedResponse({ type: CourseDto })
  createCourse(@Req() r: AcademicRequest, @Body() b: CourseInputDto) { return this.academic.createCourse(r.academicPrincipal!, b); }
  @Get('sections') @ApiOkResponse({ type: SectionPageDto })
  sections(@Req() r: AcademicRequest, @Query() q: SectionQueryDto) { return this.academic.listSections(r.academicPrincipal!, q); }
  @Post('sections') @ApiCreatedResponse({ type: SectionDto })
  createSection(@Req() r: AcademicRequest, @Body() b: SectionInputDto) { return this.academic.createSection(r.academicPrincipal!, b); }
  @Post('memberships')
  associate(@Req() r: AcademicRequest, @Body() b: MembershipDto) { return this.academic.associate(r.academicPrincipal!, b); }
  @Delete('memberships/:sectionId/:subjectId') @ApiOkResponse({ type: DeletedDto })
  dissociate(@Req() r: AcademicRequest, @Param('sectionId') s: string, @Param('subjectId') u: string, @Body() b: ReasonDto) { return this.academic.dissociate(r.academicPrincipal!, s, u, b); }
  @Get('events') @ApiOkResponse({ type: EventPageDto })
  events(@Req() r: AcademicRequest, @Query() q: EventsQueryDto) { return this.academic.listEvents(r.academicPrincipal!, q); }
  @Get('events/:id') @ApiOkResponse({ type: EventDto })
  event(@Req() r: AcademicRequest, @Param('id') id: string) { return this.academic.getEvent(r.academicPrincipal!, id); }
  @Post('events') @ApiCreatedResponse({ type: EventDto })
  createEvent(@Req() r: AcademicRequest, @Body() b: EventInputDto) { return this.academic.saveEvent(r.academicPrincipal!, b); }
  @Patch('events/:id') @ApiOkResponse({ type: EventDto })
  updateEvent(@Req() r: AcademicRequest, @Param('id') id: string, @Body() b: EventUpdateDto) { return this.academic.saveEvent(r.academicPrincipal!, b, id); }
  @Delete('events/:id') @ApiOkResponse({ type: DeletedDto })
  deleteEvent(@Req() r: AcademicRequest, @Param('id') id: string, @Body() b: EventDeleteDto) { return this.academic.deleteEvent(r.academicPrincipal!, id, b); }
}

@ApiTags('Calendario académico — titular')
@ApiUnauthorizedResponse({ description: 'Sesión válida requerida.' })
@UseGuards(AcademicSessionGuard)
@Controller('academic/me')
export class PersonalAcademicController {
  constructor(@Inject(AcademicService) private readonly academic: AcademicService) {}
  @Get('events') @ApiOkResponse({ type: EventPageDto })
  events(@Req() r: AcademicRequest, @Query() q: EventsQueryDto) { return this.academic.applicableEvents(r.academicPrincipal!, q); }
}
