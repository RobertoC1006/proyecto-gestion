import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Warning } from '@phosphor-icons/react'
import { Button, Card, CardHeading, EmptyState, Field, Notice, PageHeading, Select } from '../../components/ui'
import { request } from '../../lib/api/http'
import { useAuth } from '../auth/AuthContext'
import './demand.css'
type Alert = {id:string;source:string;weekStart:string;expected:number;capacity:number;active:boolean;runId:string;updatedAt:string;reviewedAt:string|null;reviewReason:string|null}
export default function AlertsPage(){
 const {id}=useParams(),[params,setParams]=useSearchParams(),source=params.get('source')==='synthetic'?'synthetic':'operational',client=useQueryClient(),{user}=useAuth()
 const [reason,setReason]=useState(''),[message,setMessage]=useState('')
 const list=useQuery({queryKey:['alerts',source],queryFn:()=>request<{items:Alert[]}>(`alerts?source=${source}`),enabled:!id,refetchInterval:15000})
 const detail=useQuery({queryKey:['alert',id],queryFn:()=>request<Alert>(`alerts/${id}`),enabled:!!id,refetchInterval:15000}),alert=detail.data
 const review=useMutation({mutationFn:()=>request(`alerts/${id}/review`,{method:'PATCH',body:JSON.stringify({reason})}),onSuccess:()=>{setMessage('Alerta marcada como revisada.');void client.invalidateQueries({queryKey:['alert',id]})},onError:(e:Error)=>setMessage(e.message)})
 const isSynthetic=alert?alert.source==='synthetic':source==='synthetic'
 return <section className="demand-page"><PageHeading title={id?'Detalle de alerta predictiva':'Alertas de demanda'} subtitle="Revisa la capacidad y prepara los recursos de TI." illustrationIcon={Warning}/>
 {isSynthetic&&<Notice tone="amber">Demostración con datos sintéticos. Estas alertas no representan la carga real de la institución.</Notice>}
 {(list.error||detail.error)&&<Notice tone="amber" role="alert">{(list.error||detail.error)?.message}</Notice>}
 {!id?<><div className="demand-toolbar"><Field label="Fuente"><Select value={source} onChange={e=>setParams({source:e.target.value})}><option value="operational">Histórico real</option><option value="synthetic">Demostración sintética</option></Select></Field><Link className="text-link" to={`/demanda?source=${source}`}>Ver pronóstico</Link></div><div className="demand-alert-list">{list.data?.items.map(a=><Link className="demand-alert" key={a.id} to={`/alertas/${a.id}`}><div><strong>{a.active?'Posible sobrecarga':'Capacidad suficiente tras actualización'}</strong><p>Semana del {a.weekStart.slice(0,10)} · {Math.round(a.expected).toLocaleString('es-PE')} tickets previstos / {a.capacity} de capacidad</p></div><span>{a.reviewedAt?'Revisada':'Pendiente de revisión'} →</span></Link>)}</div>{list.data?.items.length===0&&<Card><EmptyState title="Sin alertas registradas" description="Se creará una alerta cuando una semana completa del pronóstico supere la capacidad configurada."/></Card>}</>:alert&&<>
 <Notice tone={alert.active?'amber':'green'}>{alert.active?'Posible sobrecarga de atención':'La actualización está dentro de la capacidad'} · {alert.reviewedAt?'Revisada':'Pendiente de revisión'}</Notice>
 <div className="demand-grid"><Card><CardHeading title="Pronóstico vs. capacidad"/><div className="demand-chart" role="img" aria-label={`${Math.round(alert.expected)} tickets previstos frente a ${alert.capacity} de capacidad semanal`}><ResponsiveContainer width="100%" height="100%"><BarChart data={[{name:'Pronóstico',tickets:Math.round(alert.expected)},{name:'Capacidad',tickets:alert.capacity}]}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="tickets" fill="#00965e" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></Card><Card><CardHeading title="Preparación de recursos"/><p><strong>Semana:</strong> {alert.weekStart.slice(0,10)} · tickets/semana</p><p><strong>Última actualización:</strong> {new Date(alert.updatedAt).toLocaleString('es-PE',{timeZone:'America/Lima'})}</p><ul><li>Evaluar refuerzo de turnos.</li><li>Revisar la disponibilidad del equipo.</li><li>Contrastar el calendario académico.</li></ul><Notice>La revisión no cambia automáticamente turnos ni prioridades de incidencias.</Notice><p className="body-muted">Corrida: {alert.runId}</p></Card></div>
 <Card>{alert.reviewedAt?<p>Revisada el {new Date(alert.reviewedAt).toLocaleString('es-PE',{timeZone:'America/Lima'})}. {alert.reviewReason}</p>:user?.permissions.includes('configuration:manage')&&<><Field label="Motivo de la revisión"><input value={reason} minLength={5} maxLength={500} onChange={e=>setReason(e.target.value)}/></Field><Button disabled={reason.trim().length<5||review.isPending} onClick={()=>review.mutate()}>Marcar como revisada</Button></>}{message&&<Notice role="status">{message}</Notice>}<p><Link className="text-link" to={`/demanda?source=${alert.source}`}>Ver pronóstico</Link> · <Link className="text-link" to={`/alertas?source=${alert.source}`}>Todas las alertas</Link></p></Card>
 </>}
 </section>
}
