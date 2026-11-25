import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Query,
  Req,
  Sse,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { interval, map, startWith } from "rxjs";
import { CampusSessionGuard } from "../auth/auth.guard";
import { AuthRequest } from "../auth/auth.service";
import { NotificationsService } from "./notifications.service";
@ApiTags("Notificaciones personales")
@ApiCookieAuth("campus_session")
@UseGuards(CampusSessionGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Get() @Header("Cache-Control", "no-store") list(
    @Req() r: AuthRequest,
    @Query() q: unknown,
  ) {
    return this.service.list(r.campusPrincipal!, q);
  }
  @Patch(":id/read") read(@Req() r: AuthRequest, @Param("id") id: string) {
    return this.service.mark(r.campusPrincipal!, id);
  }
  // Señal sin contenido privado. Cada actualización relee la API con permisos vigentes.
  @Sse("events") @Header("X-Accel-Buffering", "no") events() {
    return interval(15000).pipe(
      startWith(0),
      map(() => ({ data: { refresh: true } })),
    );
  }
}
@ApiTags("Alertas de demanda")
@ApiCookieAuth("campus_session")
@UseGuards(CampusSessionGuard)
@Controller("alerts")
export class AlertsController {
  constructor(private readonly service: NotificationsService) {}
  @Get() list(@Req() r: AuthRequest, @Query() q: unknown) {
    return this.service.alerts(r.campusPrincipal!, q);
  }
  @Get(":id") detail(@Req() r: AuthRequest, @Param("id") id: string) {
    return this.service.alert(r.campusPrincipal!, id);
  }
  @Patch(":id/review") review(
    @Req() r: AuthRequest,
    @Param("id") id: string,
    @Body() b: unknown,
  ) {
    return this.service.review(r.campusPrincipal!, id, b);
  }
}
