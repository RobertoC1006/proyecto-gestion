import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CampusRole, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { IdentityDirectory } from '../auth/auth.directory';
import { CampusPrincipal } from '../auth/auth.policy';
import { SupportTeamItemDto, UpdateUserAccessDto, UserItemDto, UsersPageDto, UsersQueryDto } from './users.dto';

const missingUser = () =>
  new NotFoundException({ code: 'NOT_FOUND', message: 'No se encontró el usuario solicitado.' });

@Injectable()
export class UsersService {
  constructor(
    @Inject(PrismaService) private readonly db: PrismaService,
    @Inject(IdentityDirectory) private readonly identityDirectory: IdentityDirectory,
  ) {}

  private mapUser(u: {
    id: string;
    institutionId: string;
    email: string;
    displayName: string;
    role: CampusRole;
    active: boolean;
    teamId: string | null;
    team: { id: string; code: string; name: string } | null;
    accessVersion: number;
    createdAt: Date;
    updatedAt: Date;
  }): UserItemDto {
    return {
      id: u.id,
      institutionId: u.institutionId,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      active: u.active,
      teamId: u.teamId ?? null,
      team: u.team ? { id: u.team.id, code: u.team.code, name: u.team.name } : null,
      accessVersion: u.accessVersion,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }

  async listUsers(actor: CampusPrincipal, query: UsersQueryDto): Promise<UsersPageDto> {
    // Coerción y validación defensiva de paginación (según convención de academic):
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    // Aislamiento multi-institucional obligatorio:
    // El actor solo puede consultar usuarios de su propia institución
    const where: Prisma.AppUserWhereInput = {
      institutionId: actor.institutionId,
    };

    // Filtro por rol si es un valor válido del enum
    if (query.role && Object.values(CampusRole).includes(query.role)) {
      where.role = query.role;
    }

    // Coerción y validación del filtro booleano 'active'
    if (query.active !== undefined && query.active !== null) {
      const activeStr = String(query.active).toLowerCase().trim();
      if (activeStr === 'true' || activeStr === '1') {
        where.active = true;
      } else if (activeStr === 'false' || activeStr === '0') {
        where.active = false;
      }
    }

    // Filtro por teamId validando formato UUID
    if (
      query.teamId &&
      typeof query.teamId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.teamId.trim())
    ) {
      where.teamId = query.teamId.trim().toLowerCase();
    }

    // Filtro de búsqueda textual en displayName o email
    if (query.search && typeof query.search === 'string') {
      const term = query.search.trim().slice(0, 100);
      if (term.length > 0) {
        where.OR = [
          { displayName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    // Transacción atómica de lectura en paralelo (registros y total)
    const [rows, total] = await this.db.$transaction([
      this.db.appUser.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
        include: {
          team: { select: { id: true, code: true, name: true } },
        },
      }),
      this.db.appUser.count({ where }),
    ]);

    const items: UserItemDto[] = rows.map(u => this.mapUser(u));

    return { items, total, page, pageSize };
  }

  async getUser(actor: CampusPrincipal, id: string): Promise<UserItemDto> {
    const user = await this.db.appUser.findFirst({
      where: { id, institutionId: actor.institutionId },
      include: {
        team: { select: { id: true, code: true, name: true } },
      },
    });

    if (!user) {
      throw missingUser();
    }

    return this.mapUser(user);
  }

  async updateAccess(actor: CampusPrincipal, id: string, dto: UpdateUserAccessDto): Promise<UserItemDto> {
    // Delegación obligatoria al servicio común de Roberto:
    // Aplica validaciones de tipos, concurrencia (expectedVersion),
    // protección inquebrantable del último administrador y auditoría atómica en IdentityChange.
    await this.identityDirectory.changeAccess(actor.id, id, {
      expectedVersion: dto.expectedVersion,
      role: dto.role,
      active: dto.active,
      teamId: dto.teamId,
      reason: dto.reason,
    });

    // Retorna el registro fresco con los cambios aplicados y version incrementada
    return this.getUser(actor, id);
  }

  async listSupportTeams(actor: CampusPrincipal): Promise<SupportTeamItemDto[]> {
    const teams = await this.db.supportTeam.findMany({
      where: { institutionId: actor.institutionId },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    });

    return teams.map(t => ({ id: t.id, code: t.code, name: t.name }));
  }
}
