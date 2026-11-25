import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DemandService } from "./demand.service";
import { DemandController } from "./demand.controller";
import { DemandJobs } from "./demand.jobs";
import { NotificationsModule } from "../notifications/notifications.module";
@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [DemandController],
  providers: [DemandService, DemandJobs],
  exports: [DemandService],
})
export class DemandModule {}
