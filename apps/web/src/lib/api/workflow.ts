import { request } from './http'
import type { Ticket } from './tickets'
export type Context = {factor:number;reason:string;event:{eventId:string;title:string;type:string;startsAt:string;endsAt:string}|null;evaluatedAt:string}
export type WorkflowTicket = Ticket & {urgency:number|null;impact:number|null;score:number|null;technicalScore:number|null;ownerName?:string;courseName?:string;assigneeName?:string;assigneeId?:string|null;academicContext:Context|null;changes?:{id:string;action:string;note:string;createdAt:string}[]}
export type Rule = {priority:string;threshold:number;responseMinutes:number;resolutionMinutes:number}
export const workflowApi={
 queue:(params:URLSearchParams)=>request<{items:WorkflowTicket[];total:number;page:number;pageSize:number;summary:{status:string;_count:number}[]}>(`operations/tickets?${params}`),
 detail:(id:string)=>request<WorkflowTicket>(`operations/tickets/${encodeURIComponent(id)}`),
 action:(id:string,body:Record<string,unknown>)=>request<WorkflowTicket>(`operations/tickets/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(body)}),
 policy:()=>request<{rules:Rule[];version:number}>('operations/policy'),
 savePolicy:(body:unknown)=>request('operations/policy',{method:'PATCH',body:JSON.stringify(body)}),
 demo:(body:unknown)=>request<{message:string;count:number}>('operations/demo',{method:'POST',body:JSON.stringify(body)}),
}
export const statusLabels:Record<string,string>={registrado:'Registrada',en_atencion:'En atención',resuelto:'Resuelta'}
