import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Card, CardHeading, EmptyState, IconBubble, PageHeading } from '../components/ui'
import { roleLabels, useAuth } from '../features/auth/AuthContext'
import { navigationFor, type NavigationItem } from '../features/auth/navigation'
import '../features/home/home.css'

function ModuleList({ title, items }: { title: string; items: NavigationItem[] }) {
  if (!items.length) return null
  return <Card className="home-modules">
    <CardHeading title={title} />
    <ul className="home-module-list">
      {items.map(item => {
        const content = <>
          <IconBubble icon={item.icon} small tone={item.to ? 'green' : 'gray'} />
          <span className="home-module-copy"><strong>{item.label}</strong><span>{item.description}</span></span>
          {item.to ? <ArrowRight className="home-module-arrow" size={20} aria-hidden="true" /> : <span className="home-module-status">Próximamente</span>}
        </>
        return <li key={item.label}>{item.to
          ? <Link className="home-module" to={item.to}>{content}</Link>
          : <div className="home-module home-module--pending" aria-disabled="true">{content}</div>}
        </li>
      })}
    </ul>
  </Card>
}

export default function HomePage() {
  const { user } = useAuth()
  if (!user) return null
  const modules = navigationFor(user)
  const primary = modules.primary.filter(item => item.to !== '/')
  return <div className="content-stack home-page">
    <PageHeading title={`Hola, ${user.displayName}`} subtitle="Elige una herramienta para continuar con tus actividades." illustration={false}
      action={<span className="badge home-role">{roleLabels[user.role]}</span>}>
      <span className="home-eyebrow">Tu espacio en CampusITSM</span>
    </PageHeading>
    <ModuleList title="Tus herramientas" items={primary} />
    <ModuleList title="Administración" items={modules.administration} />
    {!primary.length && !modules.administration.length && <Card><EmptyState title="Todavía no tienes herramientas asignadas" description="Contacta con administración para revisar los accesos de tu cuenta." /></Card>}
  </div>
}
