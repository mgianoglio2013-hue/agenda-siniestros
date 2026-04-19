import React, { useState, useEffect } from 'react';

const WORKER_URL = 'https://integrity-monitor.mgianoglio2013.workers.dev';

const COMPANIAS = {
  INTEGRITY:    { nombre: 'INTEGRITY',    color: '#7c3aed', carpetaId: '1GCNODjvlybIQrpS_Yo0VonUhK0ZXmYPg' },
  GALENO:       { nombre: 'GALENO',       color: '#00a651', carpetaId: '19EKUH6T9L71WkEJGp9lvH6kQnwczja1Q' },
  MAPFRE:       { nombre: 'MAPFRE',       color: '#dc2626', carpetaId: '195un4KFUQCc8R0vW4q39cJPmVqpeEbdV' },
  PROVINCIA:    { nombre: 'PROVINCIA',    color: '#2563eb', carpetaId: '1dwwXmf9HMc0sL7tHjBKnxomdv3zCUs6D' },
  SAN_CRISTOBAL:{ nombre: 'SAN CRISTOBAL',color: '#ea580c', carpetaId: '1bP7w-E8mLev8Hk_iNteUj81ItZn1XrnE' },
};

// Estados principales
const ESTADOS_PRINCIPALES = {
  pendiente:  { nombre: 'Pendiente', color: '#64748b', bg: '#f1f5f9', icono: '🕐' },
  en_curso:   { nombre: 'En Curso',  color: '#2563eb', bg: '#eff6ff', icono: '⚙️' },
  cerrado:    { nombre: 'Cerrado',   color: '#16a34a', bg: '#f0fdf4', icono: '✅' },
};

// Subcategorías de En Curso
const SUBCATEGORIAS = {
  solicitud_documental: { nombre: '1. Solicitud de Documental', color: '#8b5cf6' },
  inspeccion:           { nombre: '2. Inspección',              color: '#0ea5e9' },
  negociacion:          { nombre: '3. Negociación',             color: '#f59e0b' },
  convenio:             { nombre: '4. Convenio',                color: '#10b981' },
};

// Mapear estado de Integrity al nuevo sistema
const mapearEstado = (estadoIntegrity) => {
  const e = (estadoIntegrity || '').toLowerCase();
  if (e === 'solicitada')  return { estado: 'pendiente', sub: null };
  if (e === 'finalizada' || e === 'anulada') return { estado: 'cerrado', sub: null };
  if (e === 'aceptada')    return { estado: 'en_curso', sub: 'solicitud_documental' };
  return { estado: 'pendiente', sub: null };
};

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const diasDesde = (iso) => {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
};

const colorDias = (d) => {
  if (d <= 5)  return '#16a34a';
  if (d <= 15) return '#f59e0b';
  return '#dc2626';
};

export default function AgendaSiniestros({ onAbrirDetalle, onSiniestrosCargados, onCambiarEstado }) {
  const [siniestros, setSiniestros]           = useState([]);
  const [companiaActiva, setCompaniaActiva]   = useState('INTEGRITY');
  const [filtroEstado, setFiltroEstado]       = useState(null); // null=todos, 'pendiente','en_curso','cerrado'
  const [filtroSub, setFiltroSub]             = useState(null);
  const [busqueda, setBusqueda]               = useState('');
  const [cargando, setCargando]               = useState(false);
  const [ultimaSync, setUltimaSync]           = useState(null);
  const [estadosLocales, setEstadosLocales]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('siniestros_estados') || '{}'); } catch { return {}; }
  });

  // Guardar estados locales en localStorage
  useEffect(() => {
    try { localStorage.setItem('siniestros_estados', JSON.stringify(estadosLocales)); } catch {}
  }, [estadosLocales]);

  // Cargar siniestros del Worker al montar
  useEffect(() => { cargarDeWorker(); }, []);

  const cargarDeWorker = async () => {
    setCargando(true);
    try {
      const r = await fetch(`${WORKER_URL}/api/siniestros`);
      const data = await r.json();
      if (data.items?.length > 0) {
        const mapeados = data.items.map((s) => {
          const mapped = mapearEstado(s.EstadoSolicitudServicio);
          const local = estadosLocales[s.Id];
          return {
            id: String(s.Id),
            numero: s.NumeroSiniestro || String(s.Id),
            compania: 'INTEGRITY',
            patente: s.Patente || '—',
            asegurado: s.Asegurado || '—',
            fechaAsignacion: s.FechaAsignacion,
            fechaSiniestro: s.FechaSiniestro,
            estadoIntegrity: s.EstadoSolicitudServicio,
            tipo: s.TipoSolicitudServicio || '',
            estado: local?.estado || mapped.estado,
            sub: local?.sub || mapped.sub,
            raw: s,
          };
        });
        setSiniestros(mapeados);
        setUltimaSync(data.lastSync);
        onSiniestrosCargados?.(mapeados);
      }
    } catch (e) {
      console.error('Error cargando siniestros:', e);
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoLocal = (id, nuevoEstado, nuevaSub = null) => {
    const upd = { ...estadosLocales, [id]: { estado: nuevoEstado, sub: nuevaSub } };
    setEstadosLocales(upd);
    setSiniestros(prev => prev.map(s => s.id === id ? { ...s, estado: nuevoEstado, sub: nuevaSub } : s));
    onCambiarEstado?.(id, nuevoEstado);
  };

  // Filtrado
  const filtrados = siniestros
    .filter(s => s.compania === companiaActiva)
    .filter(s => !filtroEstado || s.estado === filtroEstado)
    .filter(s => !filtroSub || s.sub === filtroSub)
    .filter(s => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return s.numero?.toLowerCase().includes(q) || s.patente?.toLowerCase().includes(q) || s.asegurado?.toLowerCase().includes(q);
    });

  const contar = (estado, sub = null) =>
    siniestros.filter(s => s.compania === companiaActiva && s.estado === estado && (!sub || s.sub === sub)).length;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* ===== HEADER ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: 700 }}>📋 Agenda de Siniestros</h1>
          {ultimaSync && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Sync: {new Date(ultimaSync).toLocaleString('es-AR')}</div>}
        </div>
        <button
          onClick={cargarDeWorker}
          disabled={cargando}
          style={{ padding: '9px 18px', backgroundColor: cargando ? '#94a3b8' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: cargando ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          {cargando ? '⟳ Cargando...' : '🔄 Actualizar'}
        </button>
      </div>

      {/* ===== TABS COMPAÑÍAS ===== */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {Object.entries(COMPANIAS).map(([key, comp]) => {
          const total = siniestros.filter(s => s.compania === key).length;
          const activo = companiaActiva === key;
          return (
            <button key={key} onClick={() => { setCompaniaActiva(key); setFiltroEstado(null); setFiltroSub(null); }}
              style={{ padding: '7px 14px', backgroundColor: activo ? comp.color : 'white', color: activo ? 'white' : comp.color, border: `2px solid ${comp.color}`, borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>
              {comp.nombre} <span style={{ marginLeft: '4px', background: activo ? 'rgba(255,255,255,0.3)' : comp.color, color: 'white', padding: '1px 7px', borderRadius: '10px', fontSize: '11px' }}>{total}</span>
            </button>
          );
        })}
      </div>

      {/* ===== FILTROS DE ESTADO ===== */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { setFiltroEstado(null); setFiltroSub(null); }}
          style={{ padding: '6px 12px', backgroundColor: !filtroEstado ? '#1e293b' : 'white', color: !filtroEstado ? 'white' : '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
          Todos ({siniestros.filter(s => s.compania === companiaActiva).length})
        </button>

        {Object.entries(ESTADOS_PRINCIPALES).map(([key, est]) => {
          const activo = filtroEstado === key && !filtroSub;
          return (
            <button key={key} onClick={() => { setFiltroEstado(key); setFiltroSub(null); }}
              style={{ padding: '6px 12px', backgroundColor: activo ? est.color : est.bg, color: activo ? 'white' : est.color, border: `1.5px solid ${est.color}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              {est.icono} {est.nombre} ({contar(key)})
            </button>
          );
        })}
      </div>

      {/* ===== SUBCATEGORÍAS (solo si filtroEstado = en_curso) ===== */}
      {filtroEstado === 'en_curso' && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', paddingLeft: '12px' }}>
          {Object.entries(SUBCATEGORIAS).map(([key, sub]) => {
            const activo = filtroSub === key;
            return (
              <button key={key} onClick={() => setFiltroSub(filtroSub === key ? null : key)}
                style={{ padding: '4px 10px', backgroundColor: activo ? sub.color : 'white', color: activo ? 'white' : sub.color, border: `1px solid ${sub.color}`, borderRadius: '12px', cursor: 'pointer', fontSize: '11px' }}>
                {sub.nombre} ({contar('en_curso', key)})
              </button>
            );
          })}
        </div>
      )}

      {/* ===== BÚSQUEDA ===== */}
      <input type="text" placeholder="🔍 Buscar por número, patente o asegurado..."
        value={busqueda} onChange={e => setBusqueda(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', marginBottom: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
      />

      {/* ===== TABLA ===== */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p>No hay siniestros</p>
          {companiaActiva === 'INTEGRITY' && siniestros.length === 0 && (
            <button onClick={cargarDeWorker} style={{ marginTop: '8px', padding: '10px 20px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              🔄 Cargar siniestros de Integrity
            </button>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {/* Cabecera tabla */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1.2fr 1.6fr 1fr 80px', gap: '0', backgroundColor: '#f1f5f9', padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <div>Número / Tipo</div>
            <div>Patente</div>
            <div>Asegurado</div>
            <div>F. Asignación</div>
            <div>Estado</div>
            <div style={{ textAlign: 'center' }}>Días</div>
            <div></div>
          </div>

          {/* Filas */}
          {filtrados.map((s, idx) => {
            const est = ESTADOS_PRINCIPALES[s.estado] || ESTADOS_PRINCIPALES.pendiente;
            const sub = s.sub ? SUBCATEGORIAS[s.sub] : null;
            const dias = diasDesde(s.fechaAsignacion);

            return (
              <div key={s.id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1.2fr 1.6fr 1fr 80px', gap: '0', padding: '12px 16px', borderTop: idx === 0 ? 'none' : '1px solid #f1f5f9', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                onClick={() => onAbrirDetalle?.(s)}
              >
                {/* Número */}
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>{s.numero}</div>
                  {s.tipo && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.tipo.replace('Liquidación ', '')}</div>}
                </div>

                {/* Patente */}
                <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#374151', fontSize: '13px' }}>{s.patente}</div>

                {/* Asegurado */}
                <div style={{ color: '#374151', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.asegurado}</div>

                {/* Fecha */}
                <div style={{ color: '#64748b', fontSize: '12px' }}>{fmt(s.fechaAsignacion)}</div>

                {/* Estado con selector */}
                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <select value={s.estado}
                    onChange={e => cambiarEstadoLocal(s.id, e.target.value, e.target.value === 'en_curso' ? (s.sub || 'solicitud_documental') : null)}
                    style={{ padding: '3px 6px', backgroundColor: est.color, color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    {Object.entries(ESTADOS_PRINCIPALES).map(([k, v]) => (
                      <option key={k} value={k}>{v.icono} {v.nombre}</option>
                    ))}
                  </select>

                  {s.estado === 'en_curso' && (
                    <select value={s.sub || 'solicitud_documental'}
                      onChange={e => cambiarEstadoLocal(s.id, 'en_curso', e.target.value)}
                      style={{ padding: '3px 6px', backgroundColor: sub?.color || '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>
                      {Object.entries(SUBCATEGORIAS).map(([k, v]) => (
                        <option key={k} value={k}>{v.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Días */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', backgroundColor: colorDias(dias), color: 'white', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>{dias}d</span>
                </div>

                {/* Botón detalle */}
                <div onClick={e => e.stopPropagation()}>
                  <button onClick={() => onAbrirDetalle?.(s)}
                    style={{ padding: '5px 10px', backgroundColor: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                    Ver →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
        {filtrados.length} siniestros mostrados
      </div>
    </div>
  );
}
