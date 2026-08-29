import { describe, expect, it } from 'vitest'; import { createSchedule } from './amortization';
describe('amortización',()=>{
  it('liquida exactamente el capital en la ultima parcialidad',()=>{
    const rows=createSchedule({principal:10000,rate:15,installments:5,firstPayment:'2026-09-01',frequency:'monthly',type:'simple'});
    expect(rows).toHaveLength(5);
    expect(rows.at(-1)?.balance).toBe(0);
    expect(rows.reduce((s,r)=>s+r.principal,0)).toBe(10000);
  });
  it('interés simple es constante',()=>{
    const rows=createSchedule({principal:1000,rate:15,installments:2,firstPayment:'2026-09-01',frequency:'weekly',type:'simple'});
    expect(rows[0].interest).toBe(rows[1].interest);
  });
  it('15% semanal sobre 1000 da 150 de interes por parcialidad',()=>{
    const rows=createSchedule({principal:1000,rate:15,installments:4,firstPayment:'2026-09-04',frequency:'weekly',type:'simple'});
    expect(rows[0].interest).toBe(150);
  });
  it('solo interes: el capital no se abona hasta la ultima parcialidad',()=>{
    const rows=createSchedule({principal:1000,rate:15,installments:4,firstPayment:'2026-09-04',frequency:'weekly',type:'simple'});
    expect(rows[0].principal).toBe(0);
    expect(rows[1].principal).toBe(0);
    expect(rows[2].principal).toBe(0);
    expect(rows[3].principal).toBe(1000);
    expect(rows.every((r) => r.interest === 150)).toBe(true);
    expect(rows[3].total).toBe(1150);
  });
});
