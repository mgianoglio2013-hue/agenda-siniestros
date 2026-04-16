import { useState, useRef, useEffect } from 'react'

export default function ChatAgente({ siniestros = [], onCambiarEstado }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mensajes, setMensajes] = useState([
    { tipo: 'agente', texto: '¡Hola! Soy tu asistente de siniestros. Comandos disponibles:\n• revisar - Ver siniestros en recepción\n• aceptar [NUM] - Aceptar siniestro\n• dictaminar [NUM] - Analizar culpabilidad\n• buscar [NUM] - Buscar siniestro\n• ayuda - Ver comandos' }
  ])
  const [input, setInput] = useState('')
  const [procesando, setProcesando] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensajes])

  const agregarMensaje = (tipo, texto) => {
    setMensajes(prev => [...prev, { tipo, texto }])
  }

  const procesarComando = async (comando) => {
    const cmd = comando.toLowerCase().trim()
    const partes = cmd.split(' ')
    const accion = partes[0]
    const parametro = partes.slice(1).join(' ')

    // Comando: revisar
    if (accion === 'revisar') {
      const enRecepcion = siniestros.filter(s => s.estado === 'recepcion')
      if (enRecepcion.length === 0) {
        return '✅ No hay siniestros pendientes en recepción.'
      }
      const lista = enRecepcion.slice(0, 10).map(s => 
        `• ${s.numero} - ${s.compania} (${s.diasTranscurridos} días)`
      ).join('\n')
      return `📥 Siniestros en recepción (${enRecepcion.length}):\n${lista}${enRecepcion.length > 10 ? '\n... y ' + (enRecepcion.length - 10) + ' más' : ''}`
    }

    // Comando: aceptar NUM
    if (accion === 'aceptar') {
      if (!parametro) return '❌ Usá: aceptar [NUMERO]\nEjemplo: aceptar 493699'
      const siniestro = siniestros.find(s => s.numero === parametro)
      if (!siniestro) return `❌ No encontré el siniestro ${parametro}`
      if (siniestro.estado !== 'recepcion') return `⚠️ El siniestro ${parametro} ya no está en recepción (estado: ${siniestro.estado})`
      
      if (onCambiarEstado) {
        onCambiarEstado(siniestro.id, 'analisis')
      }
      return `✅ Siniestro ${parametro} aceptado.\nEstado: recepción → análisis\n\n¿Querés que lo dictamine? Escribí: dictaminar ${parametro}`
    }

    // Comando: dictaminar NUM
    if (accion === 'dictaminar') {
      if (!parametro) return '❌ Usá: dictaminar [NUMERO]\nEjemplo: dictaminar 493699'
      const siniestro = siniestros.find(s => s.numero === parametro)
      if (!siniestro) return `❌ No encontré el siniestro ${parametro}`
      
      // Simulación de análisis IA
      return `⚖️ DICTAMEN SINIESTRO ${parametro}\n━━━━━━━━━━━━━━━━━━━━\n\n📋 Analizando declaración...\n\n🔍 Factores evaluados:\n• Señalización\n• Prioridad de paso\n• Velocidad estimada\n• Daños materiales\n\n📊 RESULTADO PRELIMINAR:\nResponsabilidad: PENDIENTE\n\n⚠️ Para un dictamen completo, necesito acceso a:\n1. Declaración del asegurado\n2. Fotos del siniestro\n3. Croquis del accidente\n\n¿Abrimos la carpeta en Drive? Escribí: abrir ${parametro}`
    }

    // Comando: buscar NUM
    if (accion === 'buscar') {
      if (!parametro) return '❌ Usá: buscar [NUMERO]\nEjemplo: buscar 493699'
      const encontrados = siniestros.filter(s => 
        s.numero.includes(parametro) || s.titulo?.toLowerCase().includes(parametro.toLowerCase())
      )
      if (encontrados.length === 0) return `❌ No encontré siniestros con "${parametro}"`
      
      const lista = encontrados.slice(0, 5).map(s => 
        `• ${s.numero} - ${s.compania}\n  Estado: ${s.estado} | ${s.diasTranscurridos} días`
      ).join('\n\n')
      return `🔍 Resultados para "${parametro}":\n\n${lista}`
    }

    // Comando: abrir NUM
    if (accion === 'abrir') {
      if (!parametro) return '❌ Usá: abrir [NUMERO]'
      const siniestro = siniestros.find(s => s.numero === parametro)
      if (!siniestro) return `❌ No encontré el siniestro ${parametro}`
      
      window.open(`https://drive.google.com/drive/folders/${siniestro.id}`, '_blank')
      return `📂 Abriendo carpeta de ${parametro} en Drive...`
    }

    // Comando: resumen
    if (accion === 'resumen' || accion === 'stats' || accion === 'estadisticas') {
      const porEstado = {}
      siniestros.forEach(s => {
        porEstado[s.estado] = (porEstado[s.estado] || 0) + 1
      })
      
      const estadoLabels = {
        recepcion: '📥 Recepción',
        analisis: '⚖️ Análisis',
        informe: '📋 Informe',
        oferta: '💬 Oferta',
        convenio: '📝 Convenio',
        documentacion: '📂 Documentación',
        cierre: '✅ Cierre'
      }
      
      const lineas = Object.entries(porEstado).map(([estado, cantidad]) => 
        `${estadoLabels[estado] || estado}: ${cantidad}`
      ).join('\n')
      
      return `📊 RESUMEN DE SINIESTROS\n━━━━━━━━━━━━━━━━━━━━\nTotal: ${siniestros.length}\n\n${lineas}`
    }

    // Comando: ayuda
    if (accion === 'ayuda' || accion === 'help' || accion === '?') {
      return `📖 COMANDOS DISPONIBLES\n━━━━━━━━━━━━━━━━━━━━\n\n• revisar - Ver siniestros en recepción\n• aceptar [NUM] - Aceptar siniestro\n• dictaminar [NUM] - Analizar culpabilidad con IA\n• buscar [NUM] - Buscar siniestro\n• abrir [NUM] - Abrir carpeta en Drive\n• resumen - Ver estadísticas\n• ayuda - Este mensaje\n\nEjemplos:\n  dictaminar 493699\n  buscar TERC\n  aceptar 495517`
    }

    // Comando no reconocido
    return `❓ No entendí "${comando}"\n\nEscribí "ayuda" para ver los comandos disponibles.`
  }

  const enviarMensaje = async () => {
    if (!input.trim() || procesando) return

    const mensaje = input.trim()
    setInput('')
    agregarMensaje('usuario', mensaje)
    setProcesando(true)

    // Simular delay de procesamiento
    await new Promise(r => setTimeout(r, 500))
    
    const respuesta = await procesarComando(mensaje)
    agregarMensaje('agente', respuesta)
    setProcesando(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          transition: 'transform 0.2s, box-shadow 0.2s',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)'
          e.target.style.boxShadow = '0 6px 25px rgba(124, 58, 237, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)'
          e.target.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.4)'
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Panel de chat */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          width: '380px',
          height: '500px',
          backgroundColor: '#1e1e2e',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 999,
          border: '1px solid #313244'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🤖
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Agente IA</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {siniestros.length} siniestros cargados
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div 
            ref={chatRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#11111b'
            }}
          >
            {mensajes.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.tipo === 'usuario' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  borderRadius: msg.tipo === 'usuario' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: msg.tipo === 'usuario' ? '#7c3aed' : '#313244',
                  color: 'white',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.texto}
                </div>
              </div>
            ))}
            {procesando && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '16px 16px 16px 4px',
                  backgroundColor: '#313244',
                  color: '#a6adc8',
                  fontSize: '14px'
                }}>
                  Procesando...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#1e1e2e',
            borderTop: '1px solid #313244',
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí un comando..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '24px',
                border: '1px solid #313244',
                backgroundColor: '#11111b',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={enviarMensaje}
              disabled={procesando || !input.trim()}
              style={{
                padding: '12px 20px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: procesando || !input.trim() ? '#45475a' : '#7c3aed',
                color: 'white',
                cursor: procesando || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
