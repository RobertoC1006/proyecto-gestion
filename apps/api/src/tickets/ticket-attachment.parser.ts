import type { INestApplication } from '@nestjs/common';
import { json, type ErrorRequestHandler, type RequestHandler } from 'express';

export function registerTicketAttachmentBodyParser(app: Pick<INestApplication, 'use'>) {
  const attachmentJson = json({ limit: '7mb' });
  const putOnly: RequestHandler = (request, response, next) => request.method === 'PUT' &&
    /^\/api\/v1\/tickets\/[0-9a-fA-F-]{36}\/attachment\/?$/.test(request.originalUrl.split('?')[0])
    ? attachmentJson(request, response, next) : next();
  app.use('/api/v1/tickets/:ticketId/attachment', putOnly);
  const oversize: ErrorRequestHandler = (error, _request, response, next) => {
    if (error?.type === 'entity.too.large') response.status(413).json({ code: 'FILE_TOO_LARGE', message: 'El archivo supera el límite permitido.' });
    else next(error);
  };
  app.use(oversize);
}
