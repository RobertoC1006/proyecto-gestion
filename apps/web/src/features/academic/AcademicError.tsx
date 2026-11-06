import { AlertCircle, LockKeyhole } from 'lucide-react';
import { ApiError } from '../../lib/api/academic';

export function AcademicError({ error, retry }: { error: unknown; retry?: () => void }) {
  const denied = error instanceof ApiError && [401, 403].includes(error.status);
  return <div className="academic-message" role="alert">{denied ? <LockKeyhole size={21} /> : <AlertCircle size={21} />}<div><strong>{denied ? 'Acceso al calendario' : 'No se pudo cargar la información'}</strong><p>{error instanceof Error ? error.message : 'Revisa tu conexión e inténtalo nuevamente.'}</p></div>{!denied && retry && <button className="secondary-button" onClick={retry}>Reintentar</button>}</div>;
}
