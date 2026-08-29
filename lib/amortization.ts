export type Frequency = 'weekly'|'biweekly'|'monthly'|'custom';
export type Installment = { number:number; dueDate:string; principal:number; interest:number; total:number; balance:number };
export function addDays(date: Date, days: number) { const next=new Date(date); next.setDate(next.getDate()+days); return next; }
export function createSchedule(input:{principal:number; rate:number; installments:number; firstPayment:string; frequency:Frequency; customDays?:number; type:'simple'|'declining'}): Installment[] {
 const days=input.frequency==='weekly'?7:input.frequency==='biweekly'?15:input.frequency==='monthly'?30:(input.customDays||30); const rate=input.rate/100; let balance=input.principal; const flatInterest=input.type==='simple'?input.principal*rate:0;
 return Array.from({length:input.installments},(_,i)=>{const interest=input.type==='simple'?flatInterest:balance*rate; const principal=i===input.installments-1?balance:input.principal/input.installments; balance=Math.max(0,balance-principal); return {number:i+1,dueDate:addDays(new Date(input.firstPayment+'T12:00:00'),i*days).toISOString().slice(0,10),principal:+principal.toFixed(2),interest:+interest.toFixed(2),total:+(principal+interest).toFixed(2),balance:+balance.toFixed(2)};});
}
