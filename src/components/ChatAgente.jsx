import { useState, useRef, useEffect } from 'react'

const WORKER_URL = 'https://integrity-monitor.mgianoglio2013.workers.dev'

export default function ChatAgente({ siniestros = [], onCambiarEstado }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mensajes, setMensajes] = useState([
    {
      tipo: 'agente',
      texto:
        '¡Hola! Soy tu asistente de siniestros. Comandos disponibles:\n' +
        '• pendientes - Siniestros reales en Integrity (estado Solicitada)\n' +
        '• revisar - Siniestros en recepción (agenda local)\n' +
        '• aceptar [NUM] - Aceptar siniestro\n' +
        '• dictaminar [NUM] - Analizar culpabilidad\n' +
        '• buscar [NUM] - Buscar siniestro\n' +
        '• sincronizar - Cómo sincronizar con Integrity\n' +
        '• ayuda - Ver comandos',
    },
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
    setMensajes((prev) => [...prev, { tipo, texto }])
  }

  const fmtFecha = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const diasDesde = (iso) => {
    if (!iso) return '?'
    return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  }

  const procesarComando = async (comando) => {
    const cmd = comando.toLowerCase().trim()
    const partes = cmd.split(' ')
    const accion = partes[0]
    const parametro = partes.slice(1).join(' ')

    if (accion === 'pendientes' || accion === 'reales' || accion === 'integrity') {
      try {
        const r = await fetch(`${WORKER_URL}/api/solicitadas`)
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const data = await r.json()
        if (!data.lastSync) return '⚠️ Todavía no hay datos sincronizados.\n\nEscribí "sincronizar" para ver cómo hacerlo.'
        if (data.cantidad === 0) return '✅ No hay siniestros pendientes en Integrity.\n📅 Última sincronización: ' + fmtFecha(data.lastSync)
        const lista = data.items.slice(0, 10).map((s) => `• ID ${s.Id} - ${s.NumeroSiniestro}\n  ${s.Asegurado} | Pat: ${s.Patente || '—'} | ${diasDesde(s.FechaAsignacion)}d`).join('\n\n')
        return `📥 INTEGRITY - Estado Solicitada (${data.cantidad})\n📅 Sync: ${fmtFecha(data.lastSync)}\n━━━━━━━━━━━━━━━━━━━━\n\n${lista}${data.cantidad > 10 ? `\n\n... y ${data.cantidad - 10} más` : ''}`
      } catch (e) { return `❌ Error consultando el worker:\n${e.message}` }
    }

    if (accion === 'sincronizar' || accion === 'sync') {
      return `🔄 CÓMO SINCRONIZAR CON INTEGRITY\n━━━━━━━━━━━━━━━━━━━━\n\n1. Abrí integritynet.com.ar en otra pestaña y logueate\n\n2. Abrí DevTools (F12)\n\n3. Pegá en la Consola:\nfetch('${WORKER_URL}/api/bookmarklet').then(r=>r.text()).then(eval)\n\n4. Esperá el aviso ✅\n\n5. Volvé acá y escribí "pendientes"`
    }

    if (accion === 'revisar') {
      const enRecepcion = siniestros.filter((s) => s.estado === 'recepcion')
      if (enRecepcion.length === 0) return '✅ No hay siniestros en recepción local.\n\nProbá "pendientes" para ver los reales en Integrity.'
      return `📥 Siniestros en recepción local (${enRecepcion.length}):\n${enRecepcion.slice(0, 10).map((s) => `• ${s.numero} - ${s.compania} (${s.diasTranscurridos} días)`).join('\n')}`
    }

    if (accion === 'aceptar') {
      if (!parametro) return '❌ Usá: aceptar [NUMERO]'
      const s = siniestros.find((s) => s.numero === parametro)
      if (!s) return `❌ No encontré el siniestro ${parametro}`
      if (s.estado !== 'recepcion') return `⚠️ El siniestro ${parametro} ya no está en recepción`
      if (onCambiarEstado) onCambiarEstado(s.id, 'analisis')
      return `✅ Siniestro ${parametro} aceptado localmente.\nEstado: recepción → análisis\n\n¿Dictaminamos? Escribí: dictaminar ${parametro}`
    }

    if (accion === 'dictaminar') {
      if (!parametro) return '❌ Usá: dictaminar [NUMERO]'
      const s = siniestros.find((s) => s.numero === parametro)
      if (!s) return `❌ No encontré el siniestro ${parametro}`
      return `⚖️ DICTAMEN ${parametro}\n━━━━━━━━━━━━━━━━━━━━\n\n📋 Para dictamen completo necesito:\n1. Declaración del asegurado\n2. Fotos del siniestro\n3. Croquis\n\n¿Abrimos Drive? Escribí: abrir ${parametro}`
    }

    if (accion === 'buscar') {
      if (!parametro) return '❌ Usá: buscar [NUMERO]'
      const encontrados = siniestros.filter((s) => s.numero.includes(parametro) || s.titulo?.toLowerCase().includes(parametro.toLowerCase()))
      if (encontrados.length === 0) return `❌ No encontré siniestros con "${parametro}"`
      return `🔍 Resultados para "${parametro}":\n\n${encontrados.slice(0, 5).map((s) => `• ${s.numero} - ${s.compania}\n  Estado: ${s.estado} | ${s.diasTranscurridos} días`).join('\n\n')}`
    }

    if (accion === 'abrir') {
      if (!parametro) return '❌ Usá: abrir [NUMERO]'
      const s = siniestros.find((s) => s.numero === parametro)
      if (!s) return `❌ No encontré el siniestro ${parametro}`
      window.open(`https://drive.google.com/drive/folders/${s.id}`, '_blank')
      return `📂 Abriendo carpeta de ${parametro} en Drive...`
    }

    if (accion === 'resumen' || accion === 'stats') {
      const porEstado = {}
      siniestros.forEach((s) => { porEstado[s.estado] = (porEstado[s.estado] || 0) + 1 })
      const labels = { recepcion: '📥 Recepción', analisis: '⚖️ Análisis', informe: '📋 Informe', oferta: '💬 Oferta', convenio: '📝 Convenio', documentacion: '📂 Documentación', cierre: '✅ Cierre' }
      return `📊 RESUMEN\n━━━━━━━━━━━━━━━━━━━━\nTotal: ${siniestros.length}\n\n${Object.entries(porEstado).map(([e, c]) => `${labels[e] || e}: ${c}`).join('\n')}`
    }

    if (accion === 'ayuda' || accion === 'help' || accion === '?') {
      return `📖 COMANDOS\n━━━━━━━━━━━━━━━━━━━━\n\n🌐 INTEGRITY (real)\n• pendientes\n• sincronizar\n\n📋 LOCAL\n• revisar\n• aceptar [NUM]\n• dictaminar [NUM]\n• buscar [NUM]\n• abrir [NUM]\n• resumen\n• ayuda`
    }

    return `❓ No entendí "${comando}"\nEscribí "ayuda" para ver comandos.`
  }

  const enviarMensaje = async () => {
    if (!input.trim() || procesando) return
    const mensaje = input.trim()
    setInput('')
    agregarMensaje('usuario', mensaje)
    setProcesando(true)
    await new Promise((r) => setTimeout(r, 300))
    agregarMensaje('agente', await procesarComando(mensaje))
    setProcesando(false)
  }

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} style={{ position: 'fixed', bottom: '24px', right: '24px', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', zIndex: 1000 }}>
        {isOpen ? '✕' : '💬'}
      </button>
      {isOpen && (
        <div style={{ position: 'fixed', bottom: '100px', right: '24px', width: '380px', height: '500px', backgroundColor: '#1e1e2e', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 999, border: '1px solid #313244' }}>
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🤖</div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Agente IA</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{siniestros.length} siniestros · Integrity conectado</div>
            </div>
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#11111b' }}>
            {mensajes.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.tipo === 'usuario' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ padding: '10px 14px', borderRadius: msg.tipo === 'usuario' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: msg.tipo === 'usuario' ? '#7c3aed' : '#313244', color: 'white', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.texto}</div>
              </div>
            ))}
            {procesando && <div style={{ alignSelf: 'flex-start' }}><div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', backgroundColor: '#313244', color: '#a6adc8', fontSize: '14px' }}>Procesando...</div></div>}
          </div>
          <div style={{ padding: '12px 16px', backgroundColor: '#1e1e2e', borderTop: '1px solid #313244', display: 'flex', gap: '10px' }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje() } }} placeholder="Escribí un comando..." style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #313244', backgroundColor: '#11111b', color: 'white', fontSize: '14px', outline: 'none' }} />
            <button onClick={enviarMensaje} disabled={procesando || !input.trim()} style={{ padding: '12px 20px', borderRadius: '24px', border: 'none', backgroundColor: procesando || !input.trim() ? '#45475a' : '#7c3aed', color: 'white', cursor: procesando || !input.trim() ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>Enviar</button>
          </div>
        </div>
      )}
    </>
  )
}
