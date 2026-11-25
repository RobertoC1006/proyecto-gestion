import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from '@phosphor-icons/react'
import { Button, Card, EmptyState, Field, Notice, PageHeading, Select } from '../../components/ui'
import { request } from '../../lib/api/http'
import { useAuth } from '../auth/AuthContext'
import './notifications.css'
export type NotificationPage={items:{id:string;type:string;title:string;body:string;href:string;isDemo:boolean;readAt:string|null;createdAt:string}[];total:number;unreadCount:number;page:number;pageSize:number}
const labels:Record<string,string>={assignment:'Asignación y atención',resolution:'Resolución',certificate:'Constancias',sla80:'SLA al 80 %',sla_overdue:'SLA vencido',demand:'Demanda'}
export function useNotificationCount(){
 const {user}=useAuth(),client=useQueryClient()
 const query=useQuery({queryKey:['notifications',user?.id,'count'],queryFn:()=>request<NotificationPage>('notifications?unread=true'),enabled:!!user,refetchInterval:30000})
 useEffect(()=>{
  if(!user)return;const feed=new EventSource('/api/v1/notifications/events')
  const refresh=()=>{void client.invalidateQueries({queryKey:['notifications',user.id]})}
  feed.onopen=refresh;feed.onmessage=refresh
  return()=>feed.close()
 },[user?.id,client])
 return query.data?.unreadCount??0
}
export default function NotificationsPage(){
 const {user}=useAuth(),[type,setType]=useState(''),[unread,setUnread]=useState(false),[page,setPage]=useState(1),client=useQueryClient()
 const query=useQuery({queryKey:['notifications',user?.id,type,unread,page],queryFn:()=>request<NotificationPage>(`notifications?${new URLSearchParams({type,unread:String(unread),page:String(page)})}`),refetchInterval:30000})
 const read=useMutation({mutationFn:(id:string)=>request(`notifications/${id}/read`,{method:'PATCH'}),onSuccess:()=>void client.invalidateQueries({queryKey:['notifications',user?.id]})})
 return <section className="notifications-page"><PageHeading title="Notificaciones" subtitle="Tus avisos de seguimiento, atención y demanda." illustrationIcon={Bell}/><div className="notifications-toolbar"><Field label="Tipo de aviso"><Select value={type} onChange={e=>{setType(e.target.value);setPage(1)}}><option value="">Todos los tipos</option>{Object.entries(labels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</Select></Field><label><input type="checkbox" checked={unread} onChange={e=>{setUnread(e.target.checked);setPage(1)}}/> Solo sin leer</label><span>{query.data?.unreadCount??0} sin leer</span></div>
 {(query.error||read.error)&&<Notice tone="amber" role="alert">{(query.error||read.error)?.message}</Notice>}
 <Card>{query.data?.items.length===0&&<EmptyState title="No hay avisos en este filtro" description="Aquí aparecerán las acciones relacionadas contigo. Los avisos de prueba se identificarán como demostración."/>}<ul className="notification-list">{query.data?.items.map(n=><li className={n.readAt?'':'is-unread'} key={n.id}><Bell aria-hidden="true"/><div><span className="notification-type">{labels[n.type]||'Aviso'} {n.isDemo&&'· Demostración'}</span><h2><Link to={n.href} onClick={()=>{if(!n.readAt)read.mutate(n.id)}}>{n.title}</Link></h2><p>{n.body}</p><time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString('es-PE',{timeZone:'America/Lima'})}</time></div>{!n.readAt&&<Button variant="ghost" disabled={read.isPending} onClick={()=>read.mutate(n.id)}>Marcar como leída</Button>}</li>)}</ul></Card>
 {query.data&&query.data.total>30&&<div className="notifications-toolbar"><Button variant="secondary" disabled={page===1} onClick={()=>setPage(page-1)}>Anterior</Button><span>Página {page} · {query.data.total} avisos</span><Button variant="secondary" disabled={page*30>=query.data.total} onClick={()=>setPage(page+1)}>Siguiente</Button></div>}
 </section>
}
