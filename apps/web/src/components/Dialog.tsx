import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog className="shared-dialog" ref={ref} aria-label={title} onCancel={onClose}><div className="section-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={18} /></button></div>{children}</dialog>;
}
