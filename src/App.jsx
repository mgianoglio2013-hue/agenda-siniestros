import { useState, useEffect } from 'react'
import AgendaSiniestros from './components/AgendaSiniestros.jsx'
import DictamenIA from './components/DictamenIA.jsx'
import ChatAgente from './components/ChatAgente.jsx'

function App() {
  const [modulo, setModulo] = useState('agenda')
  const [siniestroSeleccionado, setSiniestroSeleccionado] = useState(null)
  const [siniestros, setSiniestros] = useState([])

  // Callback para recibir siniestros desde AgendaSiniestros
  const handleSiniestrosCargados = (listaSiniestros) => {
    setSiniestros(listaSiniestros)
  }

  // Callback para cambiar estado de un siniestro
  const handleCambiarEstado = (siniestroId, nuevoEstado) => {
    setSiniestros(prev => prev.map(s => 
      s.id === siniestroId ? { ...s, estado: nuevoEstado } : s
    ))
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {modulo === 'agenda' && (
        <AgendaSiniestros 
          onAbrirDictamen={(siniestro) => {
            setSiniestroSeleccionado(siniestro)
            setModulo('dictamen')
          }}
          onSiniestrosCargados={handleSiniestrosCargados}
          onCambiarEstado={handleCambiarEstado}
        />
      )}
      
      {modulo === 'dictamen' && (
        <DictamenIA 
          siniestro={siniestroSeleccionado}
          onVolver={() => setModulo('agenda')}
        />
      )}

      {/* Chat del Agente IA - siempre visible */}
      <ChatAgente 
        siniestros={siniestros}
        onCambiarEstado={handleCambiarEstado}
      />
    </div>
  )
}

export default App
