// ─── IDs de Google Drive — Agenda Siniestros ─────────────────────────────────
// Creados el 13/04/2026 para mgianoglio2013@gmail.com

export const DRIVE = {
  raiz:    '1UmFDRXhYp_un7eacG82kpzv8ItAcSy7-',
  indice:  '1y4zbvVW2EiaBnbc0KpPaKQrmtZyOpxoX',
  url_raiz:'https://drive.google.com/drive/folders/1UmFDRXhYp_un7eacG82kpzv8ItAcSy7-',
  cias: {
    'Integrity Seguros':  { id: '12aHCwv9EGAwmdylQWsRohRvByIUVISF-', color: '#7c3aed' },
    'Rus Seguros':        { id: '1YtWQP77GKvfTkGgx5iNjm_r0OwqMyndy', color: '#1d4ed8' },
    'Sancor Seguros':     { id: '1gAGwkrjMcgMFC9be7qVT9cCB3rW5bc-E', color: '#059669' },
    'MAPFRE':             { id: null, color: '#dc2626' },   // carpeta a crear
    'San Cristóbal':      { id: null, color: '#0891b2' },   // carpeta a crear
    'Galeno':             { id: null, color: '#d97706' },   // carpeta a crear
    'Provincia Seguros':  { id: null, color: '#7c3aed' },   // carpeta a crear
    '_ARCHIVADOS':        { id: '1ANofF7ud0P9fqVWi-ccS_nnCuitUtOSV', color: '#475569' },
  },
  portales: {
    'Integrity Seguros': 'https://integrity.com.ar',
    'MAPFRE':            'https://mapfre.com.ar',
    'San Cristóbal':     'https://sancristobal.com.ar',
    'Galeno':            'https://galeno.com.ar',
    'Provincia Seguros': 'https://provinciaseguros.com.ar',
    'OriongG2':          'https://orion.com.ar',
    'Valua':             'https://valua.com.ar',
  }
}

export const ETAPAS = [
  { id: 'recepcion',     label: 'Recepción',     icon: '📥', color: '#64748b' },
  { id: 'analisis',      label: 'Análisis',      icon: '⚖️', color: '#7c3aed' },
  { id: 'informe',       label: 'Informe',       icon: '📋', color: '#1d4ed8' },
  { id: 'oferta',        label: 'Oferta',        icon: '💬', color: '#0891b2' },
  { id: 'convenio',      label: 'Convenio',      icon: '📝', color: '#059669' },
  { id: 'documentacion', label: 'Documentación', icon: '📂', color: '#d97706' },
  { id: 'cierre',        label: 'Cierre',        icon: '✅', color: '#16a34a' },
]

export const ANTHROPIC_MODEL = 'claude-sonnet-4-5'
export const DRIVE_MCP_URL   = 'https://drivemcp.googleapis.com/mcp/v1'
export const GMAIL_MCP_URL   = 'https://gmailmcp.googleapis.com/mcp/v1'
