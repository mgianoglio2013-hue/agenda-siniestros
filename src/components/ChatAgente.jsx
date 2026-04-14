import { useState } from 'react'

export default function ChatAgente({ siniestros = [], isOpen, onToggle }) {
  const [msgs, setMsgs] = useState([{t:'a',txt:'Hola! Escribi ayuda'}])
  const [inp, setInp] = useState('')

  const proc = (c) => {
    if (c === 'ayuda') return 'Comandos: revisar, aceptar, dictaminar'
    if (c === 'revisar') return siniestros.filter(s=>s.estado==='recepcion').map(s=>s.numero).join(', ') || 'Sin nuevos'
    return 'Escribi ayuda'
  }

  const send = (e) => {
    e.preventDefault()
    if (!inp.trim()) return
    setMsgs(p=>[...p,{t:'u',txt:inp},{t:'a',txt:proc(inp.toLowerCase())}])
    setInp('')
  }

  if (!isOpen) return <button onClick={onToggle} style={{position:'fixed',bottom:24,right:24,width:56,height:56,borderRadius:'50%',background:'#7c3aed',color:'#fff',border:'none',fontSize:24}}>💬</button>

  return (
    <div style={{position:'fixed',bottom:24,right:24,width:350,height:450,background:'#1e293b',borderRadius:16,display:'flex',flexDirection:'column',zIndex:9999}}>
      <div style={{background:'#7c3aed',padding:12,borderRadius:'16px 16px 0 0',display:'flex',justifyContent:'space-between'}}>
        <span style={{color:'#fff',fontWeight:600}}>Agente</span>
        <button onClick={onToggle} style={{background:'none',border:'none',color:'#fff'}}>X</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:12}}>
        {msgs.map((m,i)=><div key={i} style={{marginBottom:8,textAlign:m.t==='u'?'right':'left'}}><span style={{display:'inline-block',padding:8,borderRadius:8,background:m.t==='u'?'#7c3aed':'#334155',color:'#fff'}}>{m.txt}</span></div>)}
      </div>
      <form onSubmit={send} style={{padding:12,display:'flex',gap:8}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} style={{flex:1,padding:8,borderRadius:8,border:'none',background:'#334155',color:'#fff'}}/>
        <button type="submit" style={{padding:8,borderRadius:8,background:'#7c3aed',color:'#fff',border:'none'}}>OK</button>
      </form>
    </div>
  )
      }
