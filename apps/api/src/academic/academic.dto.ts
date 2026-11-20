import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReasonDto {
  @ApiProperty({ type: String, minLength: 5, maxLength: 500, example: 'Programación de exámenes parciales.' }) reason!: string;
}
export class CourseInputDto extends ReasonDto {
  @ApiProperty({ type: String, maxLength: 40, example: 'RED-01' }) code!: string;
  @ApiProperty({ type: String, maxLength: 160, example: 'Redes I' }) name!: string;
}
export class SectionInputDto extends CourseInputDto {
  @ApiProperty({ type: String, format: 'uuid' }) courseId!: string;
}
export class MembershipDto extends ReasonDto {
  @ApiProperty({ type: String, format: 'uuid' }) subjectId!: string;
  @ApiProperty({ type: String, format: 'uuid' }) sectionId!: string;
}
export class EventInputDto extends ReasonDto {
  @ApiProperty({ type: String, maxLength: 160, example: 'Redes I · Parcial' }) title!: string;
  @ApiProperty({ type: String, enum: ['examen', 'entrega', 'matricula'] }) type!: string;
  @ApiProperty({ type: String, enum: ['institution', 'course', 'section'] }) scope!: string;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) courseId?: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) sectionId?: string | null;
  @ApiProperty({ type: String, format: 'date-time', example: '2026-11-06T10:30:00-05:00' }) startsAt!: string;
  @ApiProperty({ type: String, format: 'date-time', example: '2026-11-06T12:00:00-05:00' }) endsAt!: string;
}
export class EventUpdateDto extends EventInputDto {
  @ApiProperty({ type: Number, minimum: 1 }) expectedVersion!: number;
}
export class EventDeleteDto extends ReasonDto {
  @ApiProperty({ type: Number, minimum: 1 }) expectedVersion!: number;
}
export class PageQueryDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 }) page?: number;
  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 100 }) pageSize?: number;
}
export class SectionQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ type: String, format: 'uuid' }) courseId?: string;
}
export class PersonalSectionsQueryDto extends PageQueryDto {
  @ApiProperty({ type: String, format: 'uuid', description: 'Curso del titular cuyos grupos se consultan.' }) courseId!: string;
}
export class EventsQueryDto extends SectionQueryDto {
  @ApiProperty({ type: String, format: 'date-time' }) from!: string;
  @ApiProperty({ type: String, format: 'date-time' }) to!: string;
  @ApiPropertyOptional({ type: String, format: 'uuid' }) sectionId?: string;
  @ApiPropertyOptional({ type: String, enum: ['examen', 'entrega', 'matricula'] }) type?: string;
}
export class CourseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) institutionId!: string;
  @ApiProperty({ type: String }) code!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}
export class SectionDto extends CourseDto {
  @ApiProperty({ type: String, format: 'uuid' }) courseId!: string;
}
export class EventRelationDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) code!: string;
  @ApiProperty({ type: String }) name!: string;
}
export class EventDto {
  @ApiProperty({type:String,nullable:true}) createdById!: string | null;
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) institutionId!: string;
  @ApiProperty({ type: String }) title!: string;
  @ApiProperty({ type: String, enum: ['examen', 'entrega', 'matricula'] }) type!: string;
  @ApiProperty({ type: String, enum: ['institution', 'course', 'section'] }) scope!: string;
  @ApiProperty({ type: String, enum: ['manual'] }) source!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) courseId!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) sectionId!: string | null;
  @ApiProperty({ type: () => EventRelationDto, nullable: true }) course!: EventRelationDto | null;
  @ApiProperty({ type: () => EventRelationDto, nullable: true }) section!: EventRelationDto | null;
  @ApiProperty({ type: String, format: 'date-time' }) startsAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) endsAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
  @ApiProperty({ type: Number, minimum: 1 }) version!: number;
}
class PageDto {
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
}
export class CoursePageDto extends PageDto { @ApiProperty({ type: () => [CourseDto] }) items!: CourseDto[]; }
export class SectionPageDto extends PageDto { @ApiProperty({ type: () => [SectionDto] }) items!: SectionDto[]; }
export class EventPageDto extends PageDto { @ApiProperty({ type: () => [EventDto] }) items!: EventDto[]; }
export class DeletedDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: Boolean, example: true }) deleted!: boolean;
}
