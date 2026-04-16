import { useState } from 'react'

// Reglas de tránsito Argentina (Ley 24.449 y decretos)
const REGLAS_TRANSITO = [
  { articulo: 'Art. 39 inc. a', texto: 'Prioridad de paso en encrucijada sin señalizar: vehículo que viene por la derecha' },
  { articulo: 'Art. 39 inc. b', texto: 'En rotondas: prioridad del que circula dentro de la rotonda' },
  { articulo: 'Art. 39 inc. c', texto: 'Peatones tienen prioridad en sendas peatonales' },
  { articulo: 'Art. 40', texto: 'Velocidades máximas según zona (40-130 km/h según vía)' },
  { articulo: 'Art. 41', texto: 'Distancia de seguimiento mínima' },
  { articulo: 'Art. 42', texto: 'Adelantamiento: solo por la izquierda en vías de doble mano' },
  { articulo: 'Art. 43', texto: 'Giros: señalización previa obligatoria' },
  { articulo: 'Art. 44', texto: 'Marcha atrás: solo si no entorpece ni es peligroso' },
  { articulo: 'Art. 48', texto: 'Estacionamiento: a 10m de esquinas, no en doble fila' },
]

export default function DictamenIA({ siniestro, onVolver }) {
  const [paso, setPaso] = useState(1)
  const [descripcion, setDescripcion] = useState('')
  const [analizando, setAnalizando] = useState(false)
  const [dictamen, setDictamen] = useState(null)

  // Simular análisis IA
  const analizarConIA = async () => {
    setAnalizando(true)
    
    // Simular delay de procesamiento
    await new Promise(r => setTimeout(r, 2000))
    
    // Análisis simulado basado en palabras clave
    const texto = descripcion.toLowerCase()
    let resultado = {
      responsabilidad: 'concurrente',
      porcentaje: 50,
      fundamento: '',
      articulos: []
    }

    if (texto.includes('rotonda') || texto.includes('glorieta')) {
      resultado = {
        responsabilidad: texto.includes('tercero') ? 'sin_responsabilidad' : 'comprometida',
        porcentaje: texto.includes('tercero') ? 0 : 100,
        fundamento: 'El vehículo que ingresa a la rotonda debe ceder el paso a los que ya circulan dentro.',
        articulos: ['Art. 39 inc. b']
      }
    } else if (texto.includes('derecha') || texto.includes('prioridad')) {
      resultado = {
        responsabilidad: 'comprometida',
        porcentaje: 80,
        fundamento: 'No respetó prioridad de paso del vehículo que venía por la derecha en encrucijada sin señalizar.',
        articulos: ['Art. 39 inc. a']
      }
    } else if (texto.includes('marcha atrás') || texto.includes('retrocediendo')) {
      resultado = {
        responsabilidad: 'comprometida',
        porcentaje: 100,
        fundamento: 'La maniobra de retroceso generó el siniestro. El conductor tiene responsabilidad total.',
        articulos: ['Art. 44']
      }
    } else if (texto.includes('estacionado') || texto.includes('detenido')) {
      resultado = {
        responsabilidad: 'sin_responsabilidad',
        porcentaje: 0,
        fundamento: 'El vehículo asegurado se encontraba correctamente estacionado/detenido al momento del impacto.',
        articulos: ['Art. 48']
      }
    } else if (texto.includes('alcance') || texto.includes('por atrás')) {
      resultado = {
        responsabilidad: 'sin_responsabilidad',
        porcentaje: 0,
        fundamento: 'El tercero no mantuvo distancia de seguimiento adecuada, impactando por atrás.',
        articulos: ['Art. 41']
      }
    }

    setDictamen(resultado)
    setAnalizando(false)
    setPaso(3)
  }

  const responsabilidadLabels = {
    comprometida: { label: 'RESPONSABILIDAD COMPROMETIDA', color: '#ef4444', desc: 'Culpa del asegurado' },
    concurrente: { label: 'RESPONSABILIDAD CONCURRENTE', color: '#f59e0b', desc: 'Culpa compartida' },
    sin_responsabilidad: { label: 'SIN RESPONSABILIDAD', color: '#22c55e', desc: 'Culpa del tercero' }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={onVolver}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            ← Volver a la Agenda
          </button>
          
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            ⚖️ Dictamen IA
          </h1>
          
          {siniestro && (
            <p style={{ color: '#64748b', marginTop: '8px' }}>
              Siniestro #{siniestro.numero} • {siniestro.compania || 'INTEGRITY'}
            </p>
          )}
        </div>

        {/* Pasos */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '32px' 
        }}>
          {[1, 2, 3].map(n => (
            <div 
              key={n}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: paso >= n ? '#8b5cf6' : '#e2e8f0',
                color: paso >= n ? 'white' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600'
              }}>
                {n}
              </div>
              <span style={{ 
                color: paso >= n ? '#1e293b' : '#94a3b8',
                fontWeight: paso === n ? '600' : '400'
              }}>
                {n === 1 && 'Descripción'}
                {n === 2 && 'Análisis'}
                {n === 3 && 'Dictamen'}
              </span>
            </div>
          ))}
        </div>

        {/* Contenido por paso */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #e2e8f0'
        }}>
          {/* Paso 1: Descripción */}
          {paso === 1 && (
            <>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#1e293b'
              }}>
                Descripción del siniestro
              </h2>
              <p style={{ color: '#64748b', marginBottom: '16px' }}>
                Describí cómo ocurrió el siniestro según la declaración del asegurado y/o tercero.
              </p>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: El asegurado circulaba por calle San Martín cuando al llegar a la intersección con calle Belgrano, un vehículo tercero que venía por la derecha impactó en su lateral izquierdo..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={() => setPaso(2)}
                disabled={!descripcion.trim()}
                style={{
                  marginTop: '24px',
                  padding: '14px 28px',
                  backgroundColor: descripcion.trim() ? '#8b5cf6' : '#e2e8f0',
                  color: descripcion.trim() ? 'white' : '#94a3b8',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: descripcion.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Continuar →
              </button>
            </>
          )}

          {/* Paso 2: Análisis */}
          {paso === 2 && (
            <>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#1e293b'
              }}>
                Reglas de tránsito aplicables
              </h2>
              
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: '16px', 
                borderRadius: '12px',
                marginBottom: '24px',
                maxHeight: '250px',
                overflowY: 'auto'
              }}>
                {REGLAS_TRANSITO.map((regla, i) => (
                  <div key={i} style={{ 
                    padding: '10px 0',
                    borderBottom: i < REGLAS_TRANSITO.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#8b5cf6' 
                    }}>
                      {regla.articulo}
                    </span>
                    <span style={{ color: '#64748b', marginLeft: '8px' }}>
                      {regla.texto}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ 
                backgroundColor: '#8b5cf610', 
                padding: '16px', 
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <strong style={{ color: '#8b5cf6' }}>Descripción ingresada:</strong>
                <p style={{ marginTop: '8px', color: '#1e293b' }}>{descripcion}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setPaso(1)}
                  style={{
                    padding: '14px 28px',
                    backgroundColor: 'white',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  ← Volver
                </button>
                <button
                  onClick={analizarConIA}
                  disabled={analizando}
                  style={{
                    flex: 1,
                    padding: '14px 28px',
                    backgroundColor: analizando ? '#c4b5fd' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: analizando ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {analizando ? (
                    <>
                      <span className="spinner" style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Analizando con IA...
                    </>
                  ) : (
                    '🤖 Analizar con IA'
                  )}
                </button>
              </div>
            </>
          )}

          {/* Paso 3: Dictamen */}
          {paso === 3 && dictamen && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: responsabilidadLabels[dictamen.responsabilidad].color,
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  {responsabilidadLabels[dictamen.responsabilidad].label}
                </div>
                <p style={{ 
                  marginTop: '8px', 
                  color: '#64748b',
                  fontSize: '14px'
                }}>
                  {responsabilidadLabels[dictamen.responsabilidad].desc}
                </p>
              </div>

              {dictamen.responsabilidad === 'concurrente' && (
                <div style={{ 
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  <span style={{ fontSize: '48px', fontWeight: '700', color: '#f59e0b' }}>
                    {dictamen.porcentaje}%
                  </span>
                  <p style={{ color: '#64748b' }}>Responsabilidad asegurado</p>
                </div>
              )}

              <div style={{ 
                backgroundColor: '#f8fafc',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#1e293b',
                  marginBottom: '12px'
                }}>
                  Fundamento
                </h3>
                <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                  {dictamen.fundamento}
                </p>
                
                {dictamen.articulos.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <strong style={{ color: '#8b5cf6' }}>Artículos aplicables:</strong>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {dictamen.articulos.map((art, i) => (
                        <span key={i} style={{
                          backgroundColor: '#8b5cf620',
                          color: '#8b5cf6',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {art}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setPaso(1)
                    setDictamen(null)
                    setDescripcion('')
                  }}
                  style={{
                    padding: '14px 28px',
                    backgroundColor: 'white',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Nuevo análisis
                </button>
                <button
                  onClick={onVolver}
                  style={{
                    flex: 1,
                    padding: '14px 28px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Aprobar dictamen
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
