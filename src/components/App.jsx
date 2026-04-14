import { useState } from 'react'
import AgendaSiniestros from './AgendaSiniestros.jsx'
import DictamenIA from './DictamenIA.jsx'
import ChatAgente from './ChatAgente.jsx'

function App() {
    const [modulo, setModulo] = useState('agenda')
    const [siniestroSeleccionado, setSiniestroSeleccionado] = useState(null)
    const [siniestros, setSiniestros] = useState([])
    const [chatOpen, setChatOpen] = useState(false)

  return (
        <div>
          {modulo === 'agenda' && (
                  <AgendaSiniestros 
                              onAbrirDictamen={(siniestro) => {
                                            setSiniestroSeleccionado(siniestro)
                                                          setModulo('dictamen')
                              }}
                              onSiniestrosCargados={setSiniestros}
                            />
                )}
          {modulo === 'dictamen' && (
                  <DictamenIA 
                              siniestro={siniestroSeleccionado}
                              onVolver={() => setModulo('agenda')}
                            />
                )}
              <ChatAgente 
                        siniestros={siniestros}
                        isOpen={chatOpen}
                        onToggle={() => setChatOpen(!chatOpen)}
                      />
        </div>div>
      )
}

export default App</div>
