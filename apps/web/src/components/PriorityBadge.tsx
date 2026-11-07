import { WarningCircle as AlertCircle, ArrowDown, ArrowUp, Minus } from '@phosphor-icons/react';
import type { TicketPriority } from "../data/mock";

const priorityConfig = {
  P1: { label: "P1 · Crítica", className: "priority-p1", Icon: AlertCircle },
  P2: { label: "P2 · Alta", className: "priority-p2", Icon: ArrowUp },
  P3: { label: "P3 · Media", className: "priority-p3", Icon: Minus },
  P4: { label: "P4 · Baja", className: "priority-p4", Icon: ArrowDown },
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const { label, className, Icon } = priorityConfig[priority];
  return <span className={`priority-badge ${className}`}><Icon size={14} />{label}</span>;
}
