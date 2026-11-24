import type { INestApplication } from '@nestjs/common';
import { json } from 'express';

export function registerCertificateVerificationBodyParser(app: Pick<INestApplication, 'use'>) {
  // A 5 MiB PDF plus base64 and JSON overhead needs more than the default parser limit.
  app.use('/api/v1/certificates/public/:code/verify', json({ limit: '7mb' }));
}
