import { useState } from 'react'
import AgendaSiniestros from './components/AgendaSiniestros.jsx'
import DetalleSiniestro from './components/DetalleSiniestro.jsx'
import ChatAgente from './components/ChatAgente.jsx'

function App() {
  const [modulo, setModulo] = useState('agenda')
  const [siniestroSeleccionado, setSiniestroSeleccionado] = useState(null)
  const [siniestros, setSiniestros] = useState([])

  const handleCambiarEstado = (id, nuevoEstado) => {
    setSiniestros(prev => prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s))
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {modulo === 'agenda' && (
        <AgendaSiniestros
          onAbrirDetalle={(siniestro) => {
            setSiniestroSeleccionado(siniestro)
            setModulo('detalle')
          }}
          onSiniestrosCargados={setSiniestros}
          onCambiarEstado={handleCambiarEstado}
        />
      )}

      {modulo === 'detalle' && siniestroSeleccionado && (
        <DetalleSiniestro
          siniestro={siniestroSeleccionado}
          onVolver={() => setModulo('agenda')}
        />
      )}

      <ChatAgente
        siniestros={siniestros}
        onCambiarEstado={handleCambiarEstado}
      />
    </div>
  )
}

export default App
