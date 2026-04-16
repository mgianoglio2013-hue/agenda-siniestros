import { useState, useEffect, useMemo } from 'react'

// Siniestros INTEGRITY (100 carpetas reales de Drive)
const SINIESTROS_INTEGRITY = [
  { id: "1NsMIfTHlU9-rDaUz2S6OJqui1d7yXIBQ", numero: "493699", titulo: "493699 - 02F", fecha: "2026-04-12" },
  { id: "15XaQdAce5sOQGy1_tpCj159HcEGxtqOC", numero: "492384", titulo: "492384 - 01 F", fecha: "2026-03-28" },
  { id: "1tuZeHN7ILstnr_PKRpOVNFLLJ0tnngRw", numero: "495517", titulo: "495517", fecha: "2026-04-10" },
  { id: "15z2xfsh2VjwXj3rhosI8XSlg2DPVXZC4", numero: "495644", titulo: "495644", fecha: "2026-04-10" },
  { id: "1DzaMHTN39Uv58K-rJvNlqrsN9ikf-vvP", numero: "494570", titulo: "494570", fecha: "2026-04-10" },
  { id: "1OXl-wyUv68TbmwucHki78N2TM3unWY1v", numero: "494915", titulo: "494915", fecha: "2026-04-10" },
  { id: "1OzleB5doQI5dVpgY4KZSwjjxG2EtL-8R", numero: "495462", titulo: "495462", fecha: "2026-04-10" },
  { id: "1dktTGghOUxmdHy7pMGp9RddtJFo3_wXx", numero: "495934", titulo: "495934", fecha: "2026-04-08" },
  { id: "1GRyCloWxm23kbXuzSoVT6cKVkUwGRdAE", numero: "494934", titulo: "494934", fecha: "2026-04-08" },
  { id: "1GKz-dHRGvMgVxUqJ-_et8mSurKkLUfYU", numero: "495114", titulo: "495114", fecha: "2026-04-06" },
  { id: "1VoQs1z2EJ7a7-Mn8DKCU2qcRZVBAVH_x", numero: "495850", titulo: "495850", fecha: "2026-04-06" },
  { id: "19lWTDr3vDB6YqN8pDxiWmVJYD-BIdNed", numero: "491406", titulo: "491406", fecha: "2026-01-17" },
  { id: "1mvfJDGdrVzsJ8q_i1O9PeucwqilMkg6W", numero: "494794", titulo: "494794", fecha: "2026-04-03" },
  { id: "1JwN32y6TX9tKm-owIXArZKdnZP3HLnZp", numero: "494681", titulo: "494681", fecha: "2026-03-31" },
  { id: "1QiZw0NLoywzygXU0rIpr3ckKOauOiw40", numero: "463796", titulo: "463796", fecha: "2026-03-30" },
  { id: "1ufFuFmj0aIMsVXU65--W3O8GWmCwQsyK", numero: "495113", titulo: "495113 - 01F", fecha: "2026-03-06" },
  { id: "1vuyMnbY_ul8K1_WzHpa7fKew02bjH7Eu", numero: "494622", titulo: "494622 TERC", fecha: "2026-03-06" },
  { id: "1dlmUzcI4kqj3pSIAb7XnJjOT6X8GMjpH", numero: "495726", titulo: "495726 - 01F", fecha: "2026-03-28" },
  { id: "1skKTVBkiMEewUjQpkcCfA4MmG53rBNVb", numero: "493283", titulo: "493283", fecha: "2026-03-27" },
  { id: "1DvJuGQZCVzFWOY-RBKhpej4-fUnad1QI", numero: "495049", titulo: "495049", fecha: "2026-03-26" },
  { id: "1kA33E3jEKI8Pk86T7Q6wqskRiXxEYc-2", numero: "494864", titulo: "494864 - 01F", fecha: "2026-03-21" },
  { id: "1aaYZruerGrdEulbtXPajMMakWopSX3MQ", numero: "494712", titulo: "494712", fecha: "2026-03-20" },
  { id: "1t93tw-w7_hrmQpdHf-dJA-tgo3m1uaMH", numero: "493607", titulo: "493607", fecha: "2026-03-20" },
  { id: "1EVpGlt6XSM5YgEY96hkRkn6aVENVwQbi", numero: "475116", titulo: "475116 - 01F", fecha: "2026-03-19" },
  { id: "1PMvHMLk9qDwZd0uQ5BwPYA5rzPn9HL_z", numero: "494760", titulo: "494760 - 01 F", fecha: "2026-03-19" },
  { id: "1FELietClmmwgLlcvPMJDZwUB2_HsgSaO", numero: "493298", titulo: "493298", fecha: "2026-03-17" },
  { id: "1g3CU-cMRrY-QGPeah3c3n2MJAwKD0dsL", numero: "495111", titulo: "495111 - 01F", fecha: "2026-03-16" },
  { id: "1_3NjPKpHbtu74f3CMhh7ovPqy0OphGfX", numero: "493251", titulo: "493251", fecha: "2026-03-13" },
  { id: "1PVpJfv0Tq6nyMv8kUW5EIuMy8DllXIA3", numero: "492684", titulo: "492684", fecha: "2026-03-12" },
  { id: "1qpdafQ0bfdYI4ntPBkEkNVVlZ2xW8IiK", numero: "494257", titulo: "494257", fecha: "2026-03-12" },
  { id: "1WwWV4ErE_rRJh4rLD8OC3Zaq1gkKfnJz", numero: "491321", titulo: "491321 - 02F", fecha: "2026-03-12" },
  { id: "1mP4p6ZROHHKlQnp9yTE2aH8rmikS4vMc", numero: "477235", titulo: "477235 - 01F", fecha: "2026-03-12" },
  { id: "1Kdk5uo3tNnA_iFQ-Rp5IRS4Kk79BRR33", numero: "494937", titulo: "494937 - 01F", fecha: "2026-03-11" },
  { id: "1vYjQwqyOxK0bMw2SzR18BrowSYs3OHxi", numero: "494565", titulo: "494565-02F", fecha: "2026-03-11" },
  { id: "1aJ-o3lCsEDEW8r3brAwbSzn3gbE2-tPl", numero: "495019", titulo: "495019 - 01F", fecha: "2026-03-09" },
  { id: "1HF9vYFir1fZ5chYgjMVsXyrwi39MIaY5", numero: "489762", titulo: "489762", fecha: "2026-03-09" },
  { id: "152-kikX4h3N7y9Jg9GEc0yEwX8QOa7OC", numero: "494366", titulo: "494366 CITROEN", fecha: "2026-03-06" },
  { id: "13S8lc-vQfbLrxG4EvvHwG4F4OdmvyRub", numero: "494366", titulo: "494366 - FIAT SIENA", fecha: "2026-03-06" },
  { id: "1zKiCMdQ94hbW9MSwMZKuHYhLe3O0Jf6Q", numero: "494884", titulo: "494884 - 01F", fecha: "2026-03-06" },
  { id: "1idfmk8kiZyUftqJagv1ax-Ll11WqYPEj", numero: "494810", titulo: "494810 - 01F", fecha: "2026-03-06" },
  { id: "1IoVDoxC7jS11T7UCUZ-4RxKZ2c2LOfQS", numero: "494926", titulo: "494926", fecha: "2026-03-06" },
  { id: "1KGFk0eULPY2-k6NYvW9wEceOVjzdj1S3", numero: "mot30892", titulo: "mot30892", fecha: "2026-03-06" },
  { id: "15nb8XRWsHhqQRuUF9T5iUWiZCPooxKFy", numero: "493297", titulo: "493297", fecha: "2026-03-05" },
  { id: "1dqJaTyjgH5bG0V3--A0ZDGEGmi1RAjhi", numero: "494023", titulo: "494023 TERC", fecha: "2026-03-04" },
  { id: "1Z8JsIIU5My8r_wNuygkxHe-Vp9isR764", numero: "494762", titulo: "494762", fecha: "2026-03-03" },
  { id: "1x5MONVibri3F4FBQiyPwNDq3pm60IWc_", numero: "494568", titulo: "494568", fecha: "2026-03-03" },
  { id: "1C9Wj27qj6Mu5VAYonc08lPbG1ZrNPI1y", numero: "494548", titulo: "494548", fecha: "2026-03-03" },
  { id: "1ELu7VjIO21PcAhXXGa5evPswtBQZlosw", numero: "494861", titulo: "494861", fecha: "2026-02-27" },
  { id: "1v8cMOnOjmwzcy8OEZJhSUMlTMBbIfzRn", numero: "493761", titulo: "493761", fecha: "2026-02-27" },
  { id: "1-EIVFeDmnrjCGIGhiKFWI5EXEJvp3DJi", numero: "494535", titulo: "494535", fecha: "2026-02-27" },
  { id: "1vJ5L8RxcbK_MfzJGtyIbT77R9tWxi7qZ", numero: "494403", titulo: "494403", fecha: "2026-02-26" },
  { id: "1tgBhLAwmuJXE54446nRTWGYuO9NV6jrM", numero: "494622", titulo: "494622", fecha: "2026-02-25" },
  { id: "1dTk5szgXxTT10vGu80snDTJ7rTJRaxCE", numero: "494627", titulo: "494627", fecha: "2026-02-24" },
  { id: "1xACnTg4QjDz_JaDFtsNe-3otyCM8Xysv", numero: "494540", titulo: "494540", fecha: "2026-02-23" },
  { id: "1gR1_AfmX0VeEqQ24EWck6vpmpuRp7WE4", numero: "494309", titulo: "494309", fecha: "2026-02-23" },
  { id: "13Ezd0PBxHQATsOo8gFEZKykruexyjZ-K", numero: "494551", titulo: "494551", fecha: "2026-02-23" },
  { id: "1xaJBru47Jh3Bgzlf-P18E5a6uVI0wmzG", numero: "493238", titulo: "493238", fecha: "2026-02-19" },
  { id: "1yn7GTu7ksusq-H-YuwZaqr9X_l54NLrx", numero: "493202", titulo: "493202", fecha: "2026-02-19" },
  { id: "1HMAlX7SMj9mfCXjVyErnTG1RluZMJG1u", numero: "493214", titulo: "493214", fecha: "2026-02-18" },
  { id: "1Q2af5aelPax-nn3WCBoAuPV-x9l9EKCY", numero: "494228", titulo: "494228", fecha: "2026-02-17" },
  { id: "1ueyCrQXR0hiT1z2PELmRwYoJrKNj6ywJ", numero: "494298", titulo: "494298", fecha: "2026-02-16" },
  { id: "1EgraQIKOILk0tjQ_MgTuoUXFn9p_S7SW", numero: "493621", titulo: "493621 TERC", fecha: "2026-02-16" },
  { id: "1jmaT5-ZESPYpG0GIpZx4a5QUAY3meG7W", numero: "494336", titulo: "494336 TERC", fecha: "2026-02-16" },
  { id: "18ml08QhBIYuVIPjMY-T5WBtDHhozEUed", numero: "494336", titulo: "494336", fecha: "2026-02-16" },
  { id: "1IJHiRG8a-fDF0XZvSTy_mIeNr9OHjYvP", numero: "494462", titulo: "494462", fecha: "2026-02-16" },
  { id: "1mP4rUILxB79p0mpblrzd-iEDz_bd8m9b", numero: "492678", titulo: "492678", fecha: "2026-02-13" },
  { id: "16SNIr4tmTiMF-Ip5s93duSZ3UVh1xUAF", numero: "494252", titulo: "494252", fecha: "2026-02-12" },
  { id: "1kJB_VL4ErcMKnKrW00AyWNF2X_wlFWsp", numero: "493913", titulo: "493913 - 01F", fecha: "2026-02-12" },
  { id: "1eDIBVlnPZIiA3xpzl1Xp_c12hb1U8y_s", numero: "493915", titulo: "493915", fecha: "2026-02-12" },
  { id: "1E1_P0-5I6i_xJLNhYLlDZG40VY99e6t0", numero: "493827", titulo: "493827 TERC", fecha: "2026-02-10" },
  { id: "1XJVGFNJk3OQo_gxQKiGHxV8XGNkCcyjL", numero: "493827", titulo: "493827", fecha: "2026-02-10" },
  { id: "1QeSdOeLU6MR6fDPYXKp7DvARXNLHW4N5", numero: "493674", titulo: "493674", fecha: "2026-02-10" },
  { id: "1U2HU7b_0K4uXvwQCxdNYLhcQdg8tR8UO", numero: "493739", titulo: "493739", fecha: "2026-02-10" },
  { id: "1_i1mzggoZvlTa_yXzyqLPuULZdpQO5Ay", numero: "493206", titulo: "493206", fecha: "2026-02-07" },
  { id: "12QS1dphtj-qs7zN4fAmbBwOeq9t36QXf", numero: "494002", titulo: "494002", fecha: "2026-02-06" },
  { id: "1bzjnWwAYPbT-s-AyCnmCyawROfKxVWf5", numero: "494115", titulo: "494115", fecha: "2026-02-06" },
  { id: "1HUppfxySvL-J6XS0Tb831gdcoxHtlx3R", numero: "493944", titulo: "493944", fecha: "2026-02-06" },
  { id: "16WIAC8hTg8MbvJ8W6ILdUbFLfwunbyPX", numero: "493543", titulo: "493543", fecha: "2026-02-06" },
  { id: "1fMGazTdb5-Z4yDX48JNmzDSBu5CMBtm4", numero: "493276", titulo: "493276", fecha: "2026-02-05" },
  { id: "1loqqm0dVplIWSeR-Fg6EBWgCc7pJ9Kj0", numero: "493794", titulo: "493794", fecha: "2026-02-04" },
  { id: "1KmqHvcOXAMCSCFXdlQD0AbUSkHjkGhKO", numero: "494023", titulo: "494023", fecha: "2026-02-04" },
  { id: "17oBI4zUN-v7NtSFTIc0_Lc5E3xH9Ulc2", numero: "493983", titulo: "493983", fecha: "2026-02-04" },
  { id: "1KP-tEsYrTo5AiTO8yXWOoJ7iwP4imxUd", numero: "493174", titulo: "493174", fecha: "2026-02-04" },
  { id: "1_gtZBuqyCdnVD70HvULCcV3LuFJHb5KO", numero: "493257", titulo: "493257", fecha: "2026-02-02" },
  { id: "1djmeFCpbAJWQSbaBuSvAkol1YaVuqOVH", numero: "493518", titulo: "493518", fecha: "2026-01-30" },
  { id: "1UjKJnlwqLU8BiPQFigHTtS5em_-TcBMs", numero: "493849", titulo: "493849", fecha: "2026-01-30" },
  { id: "1-gtvL8oeaRqYGyOIzNWmFbkJ4DrY7i5W", numero: "492604", titulo: "492604", fecha: "2026-01-30" },
  { id: "1MbPT-leMpxZwuDCS1nFBUmF-0lToq71i", numero: "493691", titulo: "493691", fecha: "2026-01-30" },
  { id: "18557GW-VD2HWqDf2Q_puTfS_ME5CV4m-", numero: "492251", titulo: "492251", fecha: "2026-01-29" },
  { id: "1KpofkEsEV2WW22M6IKxVH-lYjtpahz4U", numero: "492231", titulo: "492231", fecha: "2026-01-29" },
  { id: "16aj1bMpq3NnYvpyE-8hb0lsIkd1ZG5Qd", numero: "493790", titulo: "493790", fecha: "2026-01-29" },
  { id: "1qXxfTyr2pQ6qKiB4l2gf8iMFexDx6qhj", numero: "493621", titulo: "493621", fecha: "2026-01-29" },
  { id: "1KkJ3wyvl7O0JYRwGJbvqva_TqZNc7N1I", numero: "493846", titulo: "493846", fecha: "2026-01-28" },
]

// Colores por estado
const ESTADOS = {
  recepcion: { label: 'Recepción', color: '#64748b', icon: '📥' },
  analisis: { label: 'Análisis', color: '#8b5cf6', icon: '⚖️' },
  informe: { label: 'Informe', color: '#3b82f6', icon: '📋' },
  oferta: { label: 'Oferta', color: '#06b6d4', icon: '💬' },
  convenio: { label: 'Convenio', color: '#10b981', icon: '📝' },
  documentacion: { label: 'Documentación', color: '#f59e0b', icon: '📂' },
  cierre: { label: 'Cierre', color: '#22c55e', icon: '✅' }
}

// Detectar estado por título de carpeta
function detectarEstado(titulo) {
  const t = titulo.toUpperCase()
  if (t.includes('02F')) return 'cierre'
  if (t.includes('01F') || t.includes('01 F')) return 'informe'
  if (t.includes('TERC')) return 'analisis'
  return 'recepcion'
}

// Calcular días transcurridos
function calcularDias(fechaStr) {
  const fecha = new Date(fechaStr)
  const hoy = new Date()
  const diff = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24))
  return diff
}

// Color según días
function colorDias(dias) {
  if (dias <= 15) return '#22c55e' // verde
  if (dias <= 30) return '#f59e0b' // amarillo
  return '#ef4444' // rojo
}

export default function AgendaSiniestros({ onAbrirDictamen, onSiniestrosCargados, onCambiarEstado }) {
  const [filtroCompania, setFiltroCompania] = useState('TODOS')
  const [filtroEstado, setFiltroEstado] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [siniestroActivo, setSiniestroActivo] = useState(null)

  // Procesar siniestros
  const siniestros = useMemo(() => {
    return SINIESTROS_INTEGRITY.map(s => ({
      ...s,
      compania: 'INTEGRITY',
      estado: detectarEstado(s.titulo),
      diasTranscurridos: calcularDias(s.fecha)
    }))
  }, [])

  // Notificar siniestros al padre
  useEffect(() => {
    if (onSiniestrosCargados) {
      onSiniestrosCargados(siniestros)
    }
  }, [siniestros, onSiniestrosCargados])

  // Filtrar siniestros
  const siniestrosFiltrados = useMemo(() => {
    let resultado = siniestros

    if (filtroCompania !== 'TODOS') {
      resultado = resultado.filter(s => s.compania === filtroCompania)
    }

    if (filtroEstado) {
      resultado = resultado.filter(s => s.estado === filtroEstado)
    }

    if (busqueda) {
      const b = busqueda.toLowerCase()
      resultado = resultado.filter(s => 
        s.numero.toLowerCase().includes(b) || 
        s.titulo.toLowerCase().includes(b)
      )
    }

    return resultado
  }, [siniestros, filtroCompania, filtroEstado, busqueda])

  // Contar por estado
  const contadores = useMemo(() => {
    const counts = {}
    Object.keys(ESTADOS).forEach(e => counts[e] = 0)
    
    let base = siniestros
    if (filtroCompania !== 'TODOS') {
      base = base.filter(s => s.compania === filtroCompania)
    }
    
    base.forEach(s => {
      counts[s.estado] = (counts[s.estado] || 0) + 1
    })
    
    return counts
  }, [siniestros, filtroCompania])

  // Abrir carpeta en Drive
  const abrirEnDrive = (siniestro) => {
    window.open(`https://drive.google.com/drive/folders/${siniestro.id}`, '_blank')
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Agenda de Siniestros
        </h1>
        <p style={{ color: '#64748b' }}>
          Gianoglio Peritaciones • {siniestros.length} siniestros
        </p>
      </div>

      {/* Filtros de compañía */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {['TODOS', 'INTEGRITY', 'GALENO', 'MAPFRE', 'PROVINCIA', 'SAN CRISTOBAL'].map(comp => {
          const colores = {
            TODOS: '#1e293b',
            INTEGRITY: '#7c3aed',
            GALENO: '#00a651',
            MAPFRE: '#dc2626',
            PROVINCIA: '#2563eb',
            'SAN CRISTOBAL': '#ea580c'
          }
          const activo = filtroCompania === comp
          return (
            <button
              key={comp}
              onClick={() => setFiltroCompania(comp)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activo ? colores[comp] : '#e2e8f0',
                color: activo ? 'white' : '#64748b',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {comp}
            </button>
          )
        })}
      </div>

      {/* Contadores de estado */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {Object.entries(ESTADOS).map(([key, { label, color, icon }]) => {
          const count = contadores[key] || 0
          const activo = filtroEstado === key
          return (
            <button
              key={key}
              onClick={() => setFiltroEstado(activo ? null : key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: activo ? `2px solid ${color}` : '1px solid #e2e8f0',
                backgroundColor: activo ? `${color}15` : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span>{icon}</span>
              <span style={{ fontWeight: '500', color: '#1e293b' }}>{label}</span>
              <span style={{ 
                backgroundColor: color, 
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Buscar por número de siniestro..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {/* Grid de siniestros */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {siniestrosFiltrados.map(siniestro => {
          const estado = ESTADOS[siniestro.estado]
          const activo = siniestroActivo?.id === siniestro.id
          
          return (
            <div
              key={siniestro.id}
              onClick={() => setSiniestroActivo(activo ? null : siniestro)}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: activo ? `2px solid ${estado.color}` : '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activo ? `0 4px 12px ${estado.color}30` : 'none'
              }}
            >
              {/* Header de tarjeta */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    {siniestro.numero}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b',
                    marginTop: '2px'
                  }}>
                    {siniestro.titulo}
                  </div>
                </div>
                <span style={{
                  backgroundColor: estado.color,
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {estado.icon} {estado.label}
                </span>
              </div>

              {/* Info */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  backgroundColor: '#7c3aed20',
                  color: '#7c3aed',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  INTEGRITY
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b' 
                  }}>
                    {siniestro.fecha}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: colorDias(siniestro.diasTranscurridos)
                  }}>
                    {siniestro.diasTranscurridos} días
                  </div>
                </div>
              </div>

              {/* Acciones (visible solo si está activo) */}
              {activo && (
                <div style={{ 
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      abrirEnDrive(siniestro)
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    📂 Drive
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onAbrirDictamen) onAbrirDictamen(siniestro)
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ⚖️ Dictamen
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {siniestrosFiltrados.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p>No se encontraron siniestros con los filtros actuales</p>
        </div>
      )}
    </div>
  )
}
