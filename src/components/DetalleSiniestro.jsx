import { useState, useRef } from 'react'

const WORKER = 'https://integrity-monitor.mgianoglio2013.workers.dev'
const DRIVE_CONVENIOS = 'https://drive.google.com/drive/folders/1GCNODjvlybIQrpS_Yo0VonUhK0ZXmYPg'

const SECCIONES = ['resumen','asegurado','tercero','declaraciones','fotos','documentos','chat']
const LABEL_SEC = {
  resumen: '📋 Resumen', asegurado: '👤 Asegurado', tercero: '🚗 Tercero',
  declaraciones: '⚖️ Dictamen IA', fotos: '📷 Fotos', documentos: '📄 Documentos', chat: '💬 Notas & IA'
}

const fmt = iso => iso ? new Date(iso).toLocaleDateString('es-AR') : '—'

const llamarIA = async (system, messages, maxTokens = 800) => {
  const r = await fetch(`${WORKER}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens })
  })
  const d = await r.json()
  if (d.error) throw new Error(d.error)
  return d.content?.[0]?.text || ''
}

export default function DetalleSiniestro({ siniestro, onVolver }) {
  const [seccion, setSeccion] = useState('resumen')
  const [datos, setDatos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sin_' + siniestro?.id) || '{}') } catch { return {} }
  })
  const [dictamenIA, setDictamenIA] = useState(datos.dictamen_resultado || '')
  const [generando, setGenerando] = useState(false)
  const [fotos, setFotos] = useState({ asegurado: [], tercero: [] })
  const [fotoAmpliada, setFotoAmpliada] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [chatMsgs, setChatMsgs] = useState([
    { tipo: 'ia', texto: `Hola! Soy tu asistente para el siniestro **${siniestro?.numero}**.\n\nPuedo ayudarte con:\n• Analizar las declaraciones y determinar culpabilidad\n• Redactar emails al asegurado, productor o tercero\n• Explicar artículos de la Ley 24.449\n• Sugerir estrategias de negociación\n• Calcular ofertas económicas\n\n¿Por dónde empezamos?` }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatCargando, setChatCargando] = useState(false)
  const [lugarSiniestro, setLugarSiniestro] = useState(datos.lugar_siniestro || '')
  const chatRef = useRef(null)
  const raw = siniestro?.raw || {}

  const upd = (k, v) => {
    const nd = { ...datos, [k]: v }
    setDatos(nd)
    try { localStorage.setItem('sin_' + siniestro?.id, JSON.stringify(nd)) } catch {}
  }

  const F = ({ label, campo, type = 'text', placeholder = '' }) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input type={type} value={datos[campo] || ''} onChange={e => upd(campo, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fafafa' }} />
    </div>
  )

  const T = ({ label, campo, rows = 4, placeholder = '' }) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <textarea value={datos[campo] || ''} onChange={e => upd(campo, e.target.value)} rows={rows} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', backgroundColor: '#fafafa' }} />
    </div>
  )

  const card = (children, style = {}) => (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '16px', ...style }}>{children}</div>
  )

  const tit = txt => <div style={{ fontWeight: 700, fontSize: '14px', color: '#374151', marginBottom: '14px' }}>{txt}</div>

  const grid2 = ch => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>{ch}</div>

  const generarDictamen = async () => {
    if (!datos.decl_asegurado && !datos.decl_tercero) { alert('Cargá al menos una declaración.'); return }
    setGenerando(true)
    try {
      const texto = await llamarIA('', [{
        role: 'user', content:
          `Sos un perito liquidador de siniestros de tránsito en Argentina.\n\n` +
          `SINIESTRO: ${siniestro?.numero}\nFECHA: ${fmt(siniestro?.fechaSiniestro)}\n` +
          `LUGAR: ${lugarSiniestro || datos.lugar_siniestro || '(no especificado)'}\n` +
          `VEH. ASEGURADO: ${datos.vehiculo_marca || ''} ${datos.vehiculo_modelo || ''} Pat. ${datos.vehiculo_patente || siniestro?.patente || ''}\n` +
          `VEH. TERCERO: ${datos.tercero_vehiculo_marca || ''} ${datos.tercero_vehiculo_modelo || ''} Pat. ${datos.tercero_vehiculo_patente || ''}\n\n` +
          `DECLARACIÓN ASEGURADO:\n${datos.decl_asegurado || '(No cargada)'}\n\n` +
          `DECLARACIÓN TERCERO:\n${datos.decl_tercero || '(No cargada)'}\n\n` +
          `${datos.dictamen_aclaracion ? 'ACLARACIONES DEL PERITO:\n' + datos.dictamen_aclaracion + '\n\n' : ''}` +
          `Respondé con:\n1. RESUMEN DEL SINIESTRO\n2. ANÁLISIS DECLARACIÓN ASEGURADO\n3. ANÁLISIS DECLARACIÓN TERCERO\n` +
          `4. ARTÍCULOS APLICABLES LEY 24.449\n5. DETERMINACIÓN: [COMPROMETIDA / CONCURRENTE / SIN RESPONSABILIDAD]\n` +
          `6. FUNDAMENTO JURÍDICO\n7. SUGERENCIA DE OFERTA (Peritado: $${datos.monto_peritado || '?'} vs Reclamado: $${datos.monto_reclamado || '?'})`
      }], 1500)
      setDictamenIA(texto)
      upd('dictamen_resultado', texto)
    } catch (e) { setDictamenIA('Error: ' + e.message) }
    setGenerando(false)
  }

  const enviarChat = async () => {
    if (!chatInput.trim() || chatCargando) return
    const msg = chatInput.trim()
    setChatInput('')
    const nuevosMsgs = [...chatMsgs, { tipo: 'user', texto: msg }]
    setChatMsgs(nuevosMsgs)
    setChatCargando(true)

    const system = `Sos un asistente experto en peritación de siniestros de tránsito en Argentina. Trabajás con el perito liquidador Mariano Gianoglio.

CONTEXTO DEL CASO:
- Siniestro: ${siniestro?.numero}
- Asegurado: ${datos.asegurado_nombre || siniestro?.asegurado || '—'}
- Patente asegurado: ${datos.vehiculo_patente || siniestro?.patente || '—'}
- Tercero: ${datos.tercero_nombre || '—'} ${datos.tercero_apellido || ''}
- Patente tercero: ${datos.tercero_vehiculo_patente || '—'}
- Monto reclamado: $${datos.monto_reclamado || '?'}
- Monto peritado: $${datos.monto_peritado || '?'}
- Lugar del siniestro: ${lugarSiniestro || datos.lugar_siniestro || '—'}
- Dictamen actual: ${dictamenIA ? dictamenIA.substring(0, 400) + '...' : 'No generado aún'}

Respondé de forma directa, práctica y en español rioplatense. Si te piden redactar un email, dalo completo listo para enviar. Si te piden analizar la ley, cita el artículo exacto.`

    const messages = nuevosMsgs
      .filter(m => m.tipo !== 'ia' || nuevosMsgs.indexOf(m) > 0)
      .map(m => ({ role: m.tipo === 'user' ? 'user' : 'assistant', content: m.texto }))

    try {
      const respuesta = await llamarIA(system, messages, 900)
      setChatMsgs(prev => [...prev, { tipo: 'ia', texto: respuesta }])
    } catch (e) {
      setChatMsgs(prev => [...prev, { tipo: 'ia', texto: '❌ Error: ' + e.message + '\n\nVerificá que el Worker tenga configurada la variable ANTHROPIC_API_KEY.' }])
    }
    setChatCargando(false)
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 100)
  }

  const mapUrl = lugarSiniestro
    ? `https://maps.google.com/maps?q=${encodeURIComponent(lugarSiniestro)}&output=embed`
    : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui,sans-serif' }}>

      {/* HEADER */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={onVolver} style={{ padding: '7px 14px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>← Volver</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>{siniestro?.numero}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{siniestro?.asegurado} · {siniestro?.patente} · {siniestro?.tipo?.replace('Liquidación ', '')}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
          <div>Asignado: {fmt(siniestro?.fechaAsignacion)}</div>
          <div>Siniestro: {fmt(siniestro?.fechaSiniestro)}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex', overflowX: 'auto' }}>
        {SECCIONES.map(s => (
          <button key={s} onClick={() => setSeccion(s)}
            style={{ padding: '12px 16px', border: 'none', borderBottom: seccion === s ? '2px solid #7c3aed' : '2px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: seccion === s ? 700 : 400, color: seccion === s ? '#7c3aed' : '#64748b', whiteSpace: 'nowrap' }}>
            {LABEL_SEC[s]}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '960px', margin: '0 auto' }}>

        {/* RESUMEN */}
        {seccion === 'resumen' && card(<>
          {tit('📋 Datos del siniestro')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[['N° Siniestro', siniestro?.numero], ['N° Póliza', raw?.Poliza || datos.poliza || '—'], ['Fecha Siniestro', fmt(siniestro?.fechaSiniestro)], ['Fecha Asignación', fmt(siniestro?.fechaAsignacion)], ['Estado Integrity', siniestro?.estadoIntegrity || '—'], ['Tipo', siniestro?.tipo || '—']].map(([l, v]) => (
              <div key={l} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{l}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{v}</div>
              </div>
            ))}
          </div>
          {tit('💰 Importes')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[['MONTO RECLAMADO', 'monto_reclamado', '#dc2626', '#fca5a5'], ['MONTO PERITADO', 'monto_peritado', '#16a34a', '#86efac'], ['OFERTA', 'oferta', '#2563eb', '#93c5fd']].map(([l, k, c, b]) => (
              <div key={k}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>{l}</label>
                <input value={datos[k] || ''} onChange={e => upd(k, e.target.value)} placeholder="$0"
                  style={{ width: '100%', padding: '9px', border: `1px solid ${b}`, borderRadius: '7px', fontSize: '14px', fontWeight: 700, color: c, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        </>)}

        {/* ASEGURADO */}
        {seccion === 'asegurado' && card(<>
          {tit('👤 Datos del Asegurado')}
          {grid2(<><F label="Nombre completo" campo="asegurado_nombre" /><F label="DNI" campo="asegurado_dni" /><F label="Teléfono / Cel" campo="asegurado_cel" /><F label="Email" campo="asegurado_email" type="email" /><F label="N° Póliza" campo="poliza" /></>)}
          {tit('🚗 Vehículo Asegurado')}
          {grid2(<><F label="Marca" campo="vehiculo_marca" /><F label="Modelo" campo="vehiculo_modelo" /><F label="Año" campo="vehiculo_anio" /><F label="Patente" campo="vehiculo_patente" /></>)}
          {tit('🧑‍💼 Productor')}
          {grid2(<><F label="Nombre" campo="productor_nombre" /><F label="Teléfono" campo="productor_cel" /><F label="Email" campo="productor_email" type="email" /></>)}
        </>)}

        {/* TERCERO */}
        {seccion === 'tercero' && card(<>
          {tit('👤 Reclamante / Tercero')}
          {grid2(<><F label="Nombre" campo="tercero_nombre" /><F label="Apellido" campo="tercero_apellido" /><F label="DNI" campo="tercero_dni" /><F label="Teléfono / Cel" campo="tercero_cel" /><F label="Email" campo="tercero_email" type="email" /><F label="Titular del vehículo (si difiere)" campo="tercero_titular" /></>)}
          {tit('🚗 Vehículo del Tercero')}
          {grid2(<><F label="Marca" campo="tercero_vehiculo_marca" /><F label="Modelo" campo="tercero_vehiculo_modelo" /><F label="Patente" campo="tercero_vehiculo_patente" /></>)}
        </>)}

        {/* DICTAMEN IA + MAPA */}
        {seccion === 'declaraciones' && <>
          {/* Lugar del siniestro + mapa */}
          {card(<>
            {tit('📍 Lugar del siniestro')}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input value={lugarSiniestro} onChange={e => { setLugarSiniestro(e.target.value); upd('lugar_siniestro', e.target.value) }}
                placeholder="Ej: Av. Colón y Bv. San Juan, Córdoba"
                style={{ flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', backgroundColor: '#fafafa' }} />
            </div>
            {mapUrl ? (
              <iframe src={mapUrl} width="100%" height="280" style={{ border: 0, borderRadius: '10px' }} allowFullScreen loading="lazy" title="Lugar del siniestro" />
            ) : (
              <div style={{ height: '120px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                📍 Escribí el lugar del siniestro para ver el mapa
              </div>
            )}
          </>)}

          {/* Declaraciones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {card(<T label="Declaración del Asegurado" campo="decl_asegurado" rows={9} placeholder="Transcribí la declaración del asegurado..." />)}
            {card(<T label="Declaración del Tercero / Reclamante" campo="decl_tercero" rows={9} placeholder="Transcribí la declaración del tercero..." />)}
          </div>

          {card(<>
            <T label="Aclaraciones del perito (la IA las incorpora)" campo="dictamen_aclaracion" rows={3} placeholder="Ej: El asegurado circulaba por avenida principal con prioridad de paso..." />
            <button onClick={generarDictamen} disabled={generando}
              style={{ width: '100%', padding: '12px', backgroundColor: generando ? '#94a3b8' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: generando ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700 }}>
              {generando ? '⟳ Analizando con IA...' : '⚖️ Generar Dictamen IA'}
            </button>
          </>)}

          {dictamenIA && card(<>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>📋 Dictamen IA</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => upd('dictamen_aprobado', false)} style={{ padding: '6px 14px', backgroundColor: !datos.dictamen_aprobado ? '#dc2626' : '#f1f5f9', color: !datos.dictamen_aprobado ? 'white' : '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>✗ Rectificar</button>
                <button onClick={() => upd('dictamen_aprobado', true)} style={{ padding: '6px 14px', backgroundColor: datos.dictamen_aprobado ? '#16a34a' : '#f1f5f9', color: datos.dictamen_aprobado ? 'white' : '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>✓ Aprobar</button>
              </div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: '#374151', lineHeight: '1.7', margin: 0, fontFamily: 'system-ui' }}>{dictamenIA}</pre>
            {datos.dictamen_aprobado && <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>✅ Dictamen aprobado</div>}
          </>)}
        </>}

        {/* FOTOS */}
        {seccion === 'fotos' && ['asegurado', 'tercero'].map(tipo => (
          <div key={tipo} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>{tipo === 'asegurado' ? '🚗 Fotos vehículo asegurado' : '🚗 Fotos vehículo tercero'}</div>
              <label style={{ padding: '7px 14px', backgroundColor: '#7c3aed', color: 'white', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                + Agregar fotos
                <input type="file" multiple accept="image/*" onChange={e => { const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f)); setFotos(prev => ({ ...prev, [tipo]: [...prev[tipo], ...urls] })) }} style={{ display: 'none' }} />
              </label>
            </div>
            {fotos[tipo].length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>Sin fotos</div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                {fotos[tipo].map((url, i) => <img key={i} src={url} alt="" onClick={() => { setFotoAmpliada(url); setZoom(1) }} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '2px solid #e2e8f0' }} />)}
              </div>
            }
          </div>
        ))}

        {/* DOCUMENTOS */}
        {seccion === 'documentos' && card(<>
          {tit('📄 Documentos del siniestro')}
          {[['📊 Planilla informe de inspección (Excel)', 'excel'], ['🧾 Presupuesto del tercero', 'presup'], ['📋 Certificado de cobertura', 'cert'], ['📝 Otros', 'otros']].map(([label, k]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
              <label style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#374151', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                📎 Subir <input type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) alert('Archivo "' + e.target.files[0].name + '" cargado.') }} />
              </label>
            </div>
          ))}

          {/* CONVENIOS */}
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#faf5ff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
            {tit('📝 Convenios (Word)')}
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>Descargá el modelo de convenio según el tipo de resolución del siniestro:</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[['Convenio Asegurado', 'asegurado'], ['Convenio Tercero', 'tercero'], ['Convenio Conjunto', 'conjunto']].map(([label, tipo]) => (
                <a key={tipo} href={DRIVE_CONVENIOS} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '9px 16px', backgroundColor: '#7c3aed', color: 'white', borderRadius: '7px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                  📥 {label}
                </a>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '10px 0 0' }}>Los convenios se encuentran en la carpeta de Drive de Integrity. En Fase 5 se completarán automáticamente.</p>
          </div>
        </>)}

        {/* NOTAS & CHAT */}
        {seccion === 'chat' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '16px' }}>
            {card(<>
              {tit('📝 Notas del caso')}
              <textarea value={datos.notas || ''} onChange={e => upd('notas', e.target.value)} rows={18} placeholder="Anotaciones, historial de gestión, recordatorios..."
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.6' }} />
            </>)}

            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: '520px' }}>
              <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', fontSize: '13px', fontWeight: 700 }}>
                🤖 Asistente IA — {siniestro?.numero}
              </div>
              <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#0f0f1a' }}>
                {chatMsgs.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.tipo === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                    {m.tipo === 'ia' && <div style={{ fontSize: '10px', color: '#6366f1', marginBottom: '3px', fontWeight: 600 }}>🤖 Asistente</div>}
                    <div style={{ padding: '10px 14px', borderRadius: m.tipo === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', backgroundColor: m.tipo === 'user' ? '#7c3aed' : '#1e1e38', color: 'white', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{m.texto}</div>
                  </div>
                ))}
                {chatCargando && (
                  <div style={{ alignSelf: 'flex-start' }}>
                    <div style={{ fontSize: '10px', color: '#6366f1', marginBottom: '3px', fontWeight: 600 }}>🤖 Asistente</div>
                    <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px', backgroundColor: '#1e1e38', color: '#a5b4fc', fontSize: '13px' }}>● ● ●</div>
                  </div>
                )}
              </div>

              {/* Sugerencias rápidas */}
              <div style={{ padding: '8px 12px', backgroundColor: '#1a1a2e', display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {['Redactá email al asegurado', 'Redactá email al tercero', 'Analizá la culpabilidad', 'Sugerí oferta económica'].map(s => (
                  <button key={s} onClick={() => { setChatInput(s) }}
                    style={{ padding: '4px 10px', backgroundColor: 'rgba(124,58,237,0.3)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>{s}</button>
                ))}
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#1e1e2e', borderTop: '1px solid #2d2d4e', display: 'flex', gap: '8px' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarChat() } }}
                  placeholder="Escribí tu consulta..."
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '22px', border: '1px solid #3d3d5c', backgroundColor: '#11111b', color: 'white', fontSize: '13px', outline: 'none' }} />
                <button onClick={enviarChat} disabled={chatCargando || !chatInput.trim()}
                  style={{ padding: '10px 18px', borderRadius: '22px', border: 'none', backgroundColor: chatCargando || !chatInput.trim() ? '#3d3d5c' : '#7c3aed', color: 'white', cursor: chatCargando || !chatInput.trim() ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.93)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} onWheel={e => { e.preventDefault(); setZoom(z => Math.min(Math.max(z + (e.deltaY < 0 ? 0.15 : -0.15), 0.5), 5)) }}>
            <img src={fotoAmpliada} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', transform: `scale(${zoom})`, transformOrigin: 'center', borderRadius: '8px' }} />
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
              {[['−', () => setZoom(z => Math.max(z - 0.2, 0.5))], ['100%', () => setZoom(1)], ['+', () => setZoom(z => Math.min(z + 0.2, 5))], ['✕', () => setFotoAmpliada(null)]].map(([l, fn]) => (
                <button key={l} onClick={fn} style={{ padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
