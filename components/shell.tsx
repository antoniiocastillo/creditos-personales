import Link from 'next/link';
import { signOut } from '@/lib/actions';
const links=[['/','▦','Dashboard'],['/clientes','♙','Clientes'],['/creditos','▤','Créditos'],['/pagos','◉','Pagos'],['/reportes','◫','Reportes'],['/administracion','⚙','Administración']];
export function Shell({children}:{children:React.ReactNode}){return <div className="shell"><aside className="side"><div className="brand"><span className="logo">C</span>Crédito Fácil</div><nav className="nav">{links.map(([href,icon,label])=><Link key={href} href={href} className={href==='/'?'active':''}>{icon}&nbsp;&nbsp;{label}</Link>)}</nav><div className="side-foot">v1.0 · Gestión de créditos</div></aside><main className="page">{children}</main></div>}
export function Top({title,subtitle,userName,userRole}:{title:string;subtitle:string;userName?:string;userRole?:string}){
  const initials=(userName||'?').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return <header className="top"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="user"><span className="avatar">{initials||'?'}</span><span>{userName||'Usuario'}<br/><small>{userRole==='admin'?'Acceso completo':'Operador'}</small></span><form action={signOut}><button className="link" type="submit" style={{background:'none',border:0,cursor:'pointer',font:'inherit'}}>Salir</button></form></div></header>
}
