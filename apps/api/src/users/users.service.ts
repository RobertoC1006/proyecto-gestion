import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CampusRole, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { IdentityDirectory } from '../auth/auth.directory';
import { CampusPrincipal } from '../auth/auth.policy';
import { SupportTeamItemDto, UpdateUserAccessDto, UserItemDto, UsersPageDto, UsersQueryDto } from './users.dto';
import { uuid } from '../academic/academic.validation';
import { usersQuery } from './users.validation';

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
    const { page, pageSize, role, active, teamId, search } = usersQuery(query);
    const skip = (page - 1) * pageSize;

    // Aislamiento multi-institucional obligatorio:
    // El actor solo puede consultar usuarios de su propia institución
    const where: Prisma.AppUserWhereInput = {
      institutionId: actor.institutionId,
    };

    if (role !== undefined) where.role = role;
    if (active !== undefined) where.active = active;
    if (teamId !== undefined) where.teamId = teamId;
    if (search) where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];

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
    const userId = uuid(id, 'id');
    const user = await this.db.appUser.findFirst({
      where: { id: userId, institutionId: actor.institutionId },
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
    const userId = uuid(id, 'id');
    // Delegación obligatoria al servicio común de Roberto:
    // Aplica validaciones de tipos, concurrencia (expectedVersion),
    // protección inquebrantable del último administrador y auditoría atómica en IdentityChange.
    await this.identityDirectory.changeAccess(actor.id, userId, {
      expectedVersion: dto.expectedVersion,
      role: dto.role,
      active: dto.active,
      teamId: dto.teamId,
      reason: dto.reason,
    });

    // Retorna el registro fresco con los cambios aplicados y version incrementada
    return this.getUser(actor, userId);
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
