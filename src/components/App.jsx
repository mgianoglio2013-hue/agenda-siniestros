import { useState } from 'react'
import AgendaSiniestros from './components/AgendaSiniestros.jsx'
import DictamenIA from './components/DictamenIA.jsx'

function App() {
  const [modulo, setModulo] = useState('agenda')
  const [siniestroSeleccionado, setSiniestroSeleccionado] = useState(null)

  return (
    <div>
      {modulo === 'agenda' && (
        <AgendaSiniestros 
          onAbrirDictamen={(siniestro) => {
            setSiniestroSeleccionado(siniestro)
            setModulo('dictamen')
          }}
        />
      )}
      {modulo === 'dictamen' && (
        <DictamenIA 
          siniestro={siniestroSeleccionado}
          onVolver={() => setModulo('agenda')}
        />
      )}
    </div>
  )
}

export default App
