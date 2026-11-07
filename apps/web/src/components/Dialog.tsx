import type { ReactNode } from 'react'
import { Modal } from './ui'

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <Modal open title={title} onClose={onClose}>
      <div className="modal__body">{children}</div>
    </Modal>
  )
}
