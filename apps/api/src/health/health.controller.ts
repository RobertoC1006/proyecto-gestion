import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';

class HealthResponse {
  @ApiProperty({ type: String, example: 'ok', enum: ['ok'] }) status!: string;
  @ApiProperty({ type: String, example: 'campusitsm-api' }) service!: string;
  @ApiProperty({ type: String, example: 'ok', enum: ['ok'] }) database!: string;
  @ApiProperty({ type: String, example: 'ok', enum: ['ok'] }) predictions!: string;
}

@ApiTags('Infraestructura')
@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ type: HealthResponse })
  @ApiServiceUnavailableResponse({ description: 'Una dependencia no responde.' })
  async check(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const response = await fetch(`${process.env.PREDICTIONS_URL ?? 'http://predictions:8000'}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) throw new Error('Dependency unavailable');
      return { status: 'ok', service: 'campusitsm-api', database: 'ok', predictions: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable', code: 'DEPENDENCY_UNAVAILABLE' });
    }
  }
}
