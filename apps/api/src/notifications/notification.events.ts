import { Prisma } from "@prisma/client";
export interface NotificationInput {
  id: string;
  institutionId: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  href: string;
  isDemo?: boolean;
}
// Publicación durable y atómica; no emite llamadas HTTP ni afecta el commit original.
export async function publishNotification(
  tx: Prisma.TransactionClient,
  event: NotificationInput,
) {
  await tx.notificationEvent.createMany({
    data: [event],
    skipDuplicates: true,
  });
}
