import React, { useState, useEffect } from 'react';

const COMPANIAS = {
  INTEGRITY: { nombre: 'INTEGRITY', color: '#7c3aed', carpetaId: '1GCNODjvlybIQrpS_Yo0VonUhK0ZXmYPg' },
  GALENO: { nombre: 'GALENO', color: '#00a651', carpetaId: '19EKUH6T9L71WkEJGp9lvH6kQnwczja1Q' },
  MAPFRE: { nombre: 'MAPFRE', color: '#dc2626', carpetaId: '195un4KFUQCc8R0vW4q39cJPmVqpeEbdV' },
  PROVINCIA: { nombre: 'PROVINCIA', color: '#2563eb', carpetaId: '1dwwXmf9HMc0sL7tHjBKnxomdv3zCUs6D' },
  SAN_CRISTOBAL: { nombre: 'SAN CRISTOBAL', color: '#ea580c', carpetaId: '1bP7w-E8mLev8Hk_iNteUj81ItZn1XrnE' },
};

const ESTADOS = {
  recepcion: { nombre: 'Recepción', color: '#64748b', icono: '📥' },
  analisis: { nombre: 'Análisis', color: '#8b5cf6', icono: '⚖️' },
  informe: { nombre: 'Informe', color: '#3b82f6', icono: '📋' },
  oferta: { nombre: 'Oferta', color: '#06b6d4', icono: '💬' },
  convenio: { nombre: 'Convenio', color: '#10b981', icono: '📝' },
  documentacion: { nombre: 'Documentación', color: '#f59e0b', icono: '📂' },
  cierre: { nombre: 'Cierre', color: '#22c55e', icono: '✅' },
};

const SCRAPER_URL = 'http://localhost:5000/api/integrity';

export default function AgendaSiniestros({ onAbrirDictamen, onSiniestrosCargados, onCambiarEstado }) {
  const [siniestros, setSiniestros] = useState([]);
  const [companiaActiva, setCompaniaActiva] = useState('INTEGRITY');
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [scraperStatus, setScraperStatus] = useState(null);
  const [scraperCargando, setScraperCargando] = useState(false);

  // Función para ejecutar el scraper de Integrity
  const ejecutarScraperIntegrity = async () => {
    setScraperCargando(true);
    setScraperStatus({ tipo: 'info', mensaje: 'Ejecutando scraper...' });
    
    try {
      const response = await fetch(SCRAPER_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        setScraperStatus({ tipo: 'error', mensaje: data.error });
      } else if (data.siniestros && data.siniestros.length > 0) {
        // Convertir siniestros del scraper al formato de la agenda
        const nuevosSiniestros = data.siniestros.map((s, i) => ({
          id: `SCRAPER_${s.id}_${Date.now()}`,
          numero: s.numero_siniestro,
          compania: 'INTEGRITY',
          patente: s.patente,
          asegurado: s.asegurado,
          fecha: s.fecha_siniestro,
          estado: 'recepcion', // Nuevos entran en recepción
          tipo: s.tipo,
          carpetaId: COMPANIAS.INTEGRITY.carpetaId,
          fechaAsignacion: s.fecha_asignacion,
          origen: 'scraper',
        }));
        
        // Agregar a siniestros existentes (evitar duplicados)
        setSiniestros(prev => {
          const existentes = new Set(prev.map(s => s.numero));
          const nuevos = nuevosSiniestros.filter(s => !existentes.has(s.numero));
          return [...nuevos, ...prev];
        });
        
        setScraperStatus({ 
          tipo: 'success', 
          mensaje: `✓ ${data.siniestros.length} siniestros nuevos en Solicitada` 
        });
      } else {
        setScraperStatus({ 
          tipo: 'info', 
          mensaje: `Sin siniestros pendientes (${data.total_extraidos} en total)` 
        });
      }
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setScraperStatus({ 
          tipo: 'error', 
          mensaje: 'Servidor no disponible. Ejecutá: python servidor_scraper.py' 
        });
      } else {
        setScraperStatus({ tipo: 'error', mensaje: error.message });
      }
    } finally {
      setScraperCargando(false);
      // Limpiar status después de 10 segundos
      setTimeout(() => setScraperStatus(null), 10000);
    }
  };

  // Calcular días transcurridos
  const calcularDias = (fecha) => {
    if (!fecha) return 0;
    const partes = fecha.split('/');
    if (partes.length !== 3) return 0;
    const fechaSiniestro = new Date(partes[2], partes[1] - 1, partes[0]);
    const hoy = new Date();
    return Math.floor((hoy - fechaSiniestro) / (1000 * 60 * 60 * 24));
  };

  const getColorDias = (dias) => {
    if (dias <= 15) return '#22c55e';
    if (dias <= 30) return '#f59e0b';
    return '#ef4444';
  };

  // Filtrar siniestros
  const siniestrosFiltrados = siniestros
    .filter(s => s.compania === companiaActiva)
    .filter(s => !estadoFiltro || s.estado === estadoFiltro)
    .filter(s => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return (
        s.numero?.toLowerCase().includes(q) ||
        s.patente?.toLowerCase().includes(q) ||
        s.asegurado?.toLowerCase().includes(q)
      );
    });

  // Contar por estado
  const contarPorEstado = (estado) => {
    return siniestros.filter(s => s.compania === companiaActiva && s.estado === estado).length;
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h1 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>
          📋 Agenda de Siniestros
        </h1>
        
        {/* Botón Scraper Integrity */}
        <button
          onClick={ejecutarScraperIntegrity}
          disabled={scraperCargando}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: scraperCargando ? '#94a3b8' : '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: scraperCargando ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
          }}
        >
          {scraperCargando ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
              Extrayendo...
            </>
          ) : (
            <>
              🔄 Scraper Integrity
            </>
          )}
        </button>
      </div>

      {/* Status del Scraper */}
      {scraperStatus && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '8px',
          backgroundColor: scraperStatus.tipo === 'error' ? '#fef2f2' : 
                          scraperStatus.tipo === 'success' ? '#f0fdf4' : '#eff6ff',
          color: scraperStatus.tipo === 'error' ? '#dc2626' : 
                 scraperStatus.tipo === 'success' ? '#16a34a' : '#2563eb',
          border: `1px solid ${scraperStatus.tipo === 'error' ? '#fecaca' : 
                              scraperStatus.tipo === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {scraperStatus.tipo === 'error' ? '❌' : 
           scraperStatus.tipo === 'success' ? '✅' : 'ℹ️'}
          {scraperStatus.mensaje}
        </div>
      )}

      {/* Tabs de Compañías */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {Object.entries(COMPANIAS).map(([key, comp]) => (
          <button
            key={key}
            onClick={() => setCompaniaActiva(key)}
            style={{
              padding: '8px 16px',
              backgroundColor: companiaActiva === key ? comp.color : 'white',
              color: companiaActiva === key ? 'white' : comp.color,
              border: `2px solid ${comp.color}`,
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            {comp.nombre}
            <span style={{ 
              marginLeft: '6px', 
              backgroundColor: companiaActiva === key ? 'rgba(255,255,255,0.3)' : comp.color,
              color: companiaActiva === key ? 'white' : 'white',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
            }}>
              {siniestros.filter(s => s.compania === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Filtros de Estado */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setEstadoFiltro(null)}
          style={{
            padding: '6px 12px',
            backgroundColor: !estadoFiltro ? '#1e293b' : 'white',
            color: !estadoFiltro ? 'white' : '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Todos ({siniestros.filter(s => s.compania === companiaActiva).length})
        </button>
        {Object.entries(ESTADOS).map(([key, estado]) => {
          const count = contarPorEstado(key);
          return (
            <button
              key={key}
              onClick={() => setEstadoFiltro(estadoFiltro === key ? null : key)}
              style={{
                padding: '6px 12px',
                backgroundColor: estadoFiltro === key ? estado.color : 'white',
                color: estadoFiltro === key ? 'white' : estado.color,
                border: `1px solid ${estado.color}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: count === 0 ? 0.5 : 1,
              }}
            >
              {estado.icono} {estado.nombre} ({count})
            </button>
          );
        })}
      </div>

      {/* Búsqueda */}
      <input
        type="text"
        placeholder="🔍 Buscar por número, patente o asegurado..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          marginBottom: '16px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
        }}
      />

      {/* Lista de Siniestros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {siniestrosFiltrados.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#94a3b8',
            backgroundColor: 'white',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
            <p>No hay siniestros {estadoFiltro ? `en estado "${ESTADOS[estadoFiltro]?.nombre}"` : ''}</p>
            {companiaActiva === 'INTEGRITY' && (
              <button
                onClick={ejecutarScraperIntegrity}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                🔄 Buscar en portal Integrity
              </button>
            )}
          </div>
        ) : (
          siniestrosFiltrados.map((siniestro) => {
            const dias = calcularDias(siniestro.fecha);
            const estado = ESTADOS[siniestro.estado] || ESTADOS.recepcion;
            
            return (
              <div
                key={siniestro.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${estado.color}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>
                      {siniestro.numero}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: estado.color,
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}>
                      {estado.icono} {estado.nombre}
                    </span>
                    {siniestro.origen === 'scraper' && (
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#7c3aed',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '10px',
                      }}>
                        NUEVO
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>
                    <span style={{ marginRight: '16px' }}>🚗 {siniestro.patente}</span>
                    <span>👤 {siniestro.asegurado}</span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px' 
                }}>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '4px 12px',
                    backgroundColor: getColorDias(dias),
                    color: 'white',
                    borderRadius: '8px',
                    minWidth: '60px',
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{dias}</div>
                    <div style={{ fontSize: '10px' }}>días</div>
                  </div>
                  
                  <button
                    onClick={() => onAbrirDictamen && onAbrirDictamen(siniestro)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ⚖️ Dictamen
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CSS para animación de loading */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
