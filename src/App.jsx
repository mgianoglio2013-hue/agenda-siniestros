import { useState } from 'react'
import AgendaSiniestros from './components/AgendaSiniestros.jsx'
import DictamenIA from './components/DictamenIA.jsx'

export default function App() {
  const [modulo, setModulo] = useState('agenda') // agenda | dictamen

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: '#070b14', minHeight: '100vh' }}>
      {/* NAV SUPERIOR */}
      <nav style={{
        background: '#050810', borderBottom: '1px solid #1e3a5f',
        padding: '0 24px', display: 'flex', alignItems: 'center', gap: 0, height: 42
      }}>
        <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: 13, marginRight: 28, letterSpacing: 1 }}>
          ⚡ GIANOGLIO PERITACIONES
        </span>
        {[
          { id: 'agenda',   label: '📋 Agenda',            },
          { id: 'dictamen', label: '⚖️ Dictamen IA',        },
        ].map(m => (
          <button key={m.id} onClick={() => setModulo(m.id)} style={{
            padding: '0 18px', height: '100%', border: 'none', cursor: 'pointer',
            background: modulo === m.id ? '#0d1225' : 'transparent',
            color: modulo === m.id ? '#60a5fa' : '#475569',
            borderBottom: modulo === m.id ? '2px solid #3b82f6' : '2px solid transparent',
            fontSize: 12, fontWeight: modulo === m.id ? 'bold' : 'normal',
            fontFamily: "'Courier New', monospace", transition: 'all .2s'
          }}>{m.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#334155' }}>
          ☁️ Google Drive conectado
        </div>
      </nav>

      {/* MÓDULOS */}
      {modulo === 'agenda'   && <AgendaSiniestros onAbrirDictamen={() => setModulo('dictamen')} />}
      {modulo === 'dictamen' && <DictamenIA onVolver={() => setModulo('agenda')} />}
    </div>
  )
}
