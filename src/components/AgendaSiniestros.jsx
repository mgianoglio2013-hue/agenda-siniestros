import { useState, useMemo } from "react";

// ==========================================
// 50 SINIESTROS REALES DE INTEGRITY - DRIVE
// ==========================================
const SINIESTROS = [
  { id: "1", numero: "493699", estado: "informe", cia: "INTEGRITY", fecha: "2026-04-12", url: "https://drive.google.com/drive/folders/1NsMIfTHlU9-rDaUz2S6OJqui1d7yXIBQ" },
  { id: "2", numero: "495517", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/1tuZeHN7ILstnr_PKRpOVNFLLJ0tnngRw" },
  { id: "3", numero: "495644", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/15z2xfsh2VjwXj3rhosI8XSlg2DPVXZC4" },
  { id: "4", numero: "494570", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/1DzaMHTN39Uv58K-rJvNlqrsN9ikf-vvP" },
  { id: "5", numero: "494915", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/1OXl-wyUv68TbmwucHki78N2TM3unWY1v" },
  { id: "6", numero: "495462", estado: "analisis", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/1OzleB5doQI5dVpgY4KZSwjjxG2EtL-8R" },
  { id: "7", numero: "495934", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-04-08", url: "https://drive.google.com/drive/folders/1dktTGghOUxmdHy7pMGp9RddtJFo3_wXx" },
  { id: "8", numero: "494934", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-04-08", url: "https://drive.google.com/drive/folders/1GRyCloWxm23kbXuzSoVT6cKVkUwGRdAE" },
  { id: "9", numero: "495114", estado: "informe", cia: "INTEGRITY", fecha: "2026-04-06", url: "https://drive.google.com/drive/folders/1GKz-dHRGvMgVxUqJ-_et8mSurKkLUfYU" },
  { id: "10", numero: "495850", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-04-06", url: "https://drive.google.com/drive/folders/1VoQs1z2EJ7a7-Mn8DKCU2qcRZVBAVH_x" },
  { id: "11", numero: "494794", estado: "analisis", cia: "INTEGRITY", fecha: "2026-04-03", url: "https://drive.google.com/drive/folders/1mvfJDGdrVzsJ8q_i1O9PeucwqilMkg6W" },
  { id: "12", numero: "494681", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-03-31", url: "https://drive.google.com/drive/folders/1JwN32y6TX9tKm-owIXArZKdnZP3HLnZp" },
  { id: "13", numero: "495113", estado: "informe", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1ufFuFmj0aIMsVXU65--W3O8GWmCwQsyK" },
  { id: "14", numero: "494622", estado: "oferta", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1vuyMnbY_ul8K1_WzHpa7fKew02bjH7Eu" },
  { id: "15", numero: "495726", estado: "informe", cia: "INTEGRITY", fecha: "2026-03-28", url: "https://drive.google.com/drive/folders/1dlmUzcI4kqj3pSIAb7XnJjOT6X8GMjpH" },
  { id: "16", numero: "492384", estado: "cierre", cia: "INTEGRITY", fecha: "2026-03-28", url: "https://drive.google.com/drive/folders/15XaQdAce5sOQGy1_tpCj159HcEGxtqOC" },
  { id: "17", numero: "493283", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-03-27", url: "https://drive.google.com/drive/folders/1skKTVBkiMEewUjQpkcCfA4MmG53rBNVb" },
  { id: "18", numero: "495049", estado: "analisis", cia: "INTEGRITY", fecha: "2026-03-26", url: "https://drive.google.com/drive/folders/1DvJuGQZCVzFWOY-RBKhpej4-fUnad1QI" },
  { id: "19", numero: "494864", estado: "informe", cia: "INTEGRITY", fecha: "2026-03-21", url: "https://drive.google.com/drive/folders/1kA33E3jEKI8Pk86T7Q6wqskRiXxEYc-2" },
  { id: "20", numero: "494712", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-03-20", url: "https://drive.google.com/drive/folders/1aaYZruerGrdEulbtXPajMMakWopSX3MQ" },
  { id: "21", numero: "493607", estado: "convenio", cia: "INTEGRITY", fecha: "2026-03-20", url: "https://drive.google.com/drive/folders/1t93tw-w7_hrmQpdHf-dJA-tgo3m1uaMH" },
  { id: "22", numero: "494760", estado: "informe", cia: "INTEGRITY", fecha: "2026-03-19", url: "https://drive.google.com/drive/folders/1PMvHMLk9qDwZd0uQ5BwPYA5rzPn9HL_z" },
  { id: "23", numero: "493298", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-03-17", url: "https://drive.google.com/drive/folders/1FELietClmmwgLlcvPMJDZwUB2_HsgSaO" },
  { id: "24", numero: "495111", estado: "documentacion", cia: "INTEGRITY", fecha: "2026-03-16", url: "https://drive.google.com/drive/folders/1g3CU-cMRrY-QGPeah3c3n2MJAwKD0dsL" },
  { id: "25", numero: "493251", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-03-13", url: "https://drive.google.com/drive/folders/1_3NjPKpHbtu74f3CMhh7ovPqy0OphGfX" },
  { id: "26", numero: "492684", estado: "analisis", cia: "INTEGRITY", fecha: "2026-03-12", url: "https://drive.google.com/drive/folders/1PVpJfv0Tq6nyMv8kUW5EIuMy8DllXIA3" },
  { id: "27", numero: "494257", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-03-12", url: "https://drive.google.com/drive/folders/1qpdafQ0bfdYI4ntPBkEkNVVlZ2xW8IiK" },
  { id: "28", numero: "494937", estado: "informe", cia: "INTEGRITY", fecha: "2026-03-11", url: "https://drive.google.com/drive/folders/1Kdk5uo3tNnA_iFQ-Rp5IRS4Kk79BRR33" },
  { id: "29", numero: "494565", estado: "cierre", cia: "INTEGRITY", fecha: "2026-03-11", url: "https://drive.google.com/drive/folders/1vYjQwqyOxK0bMw2SzR18BrowSYs3OHxi" },
  { id: "30", numero: "495019", estado: "oferta", cia: "INTEGRITY", fecha: "2026-03-09", url: "https://drive.google.com/drive/folders/1aJ-o3lCsEDEW8r3brAwbSzn3gbE2-tPl" },
  { id: "31", numero: "494366", estado: "analisis", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/152-kikX4h3N7y9Jg9GEc0yEwX8QOa7OC" },
  { id: "32", numero: "494884", estado: "informe", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1zKiCMdQ94hbW9MSwMZKuHYhLe3O0Jf6Q" },
  { id: "33", numero: "494810", estado: "convenio", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1idfmk8kiZyUftqJagv1ax-Ll11WqYPEj" },
  { id: "34", numero: "494926", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1IoVDoxC7jS11T7UCUZ-4RxKZ2c2LOfQS" },
  { id: "35", numero: "493297", estado: "documentacion", cia: "INTEGRITY", fecha: "2026-03-05", url: "https://drive.google.com/drive/folders/15nb8XRWsHhqQRuUF9T5iUWiZCPooxKFy" },
  { id: "36", numero: "494023", estado: "oferta", cia: "INTEGRITY", fecha: "2026-03-04", url: "https://drive.google.com/drive/folders/1dqJaTyjgH5bG0V3--A0ZDGEGmi1RAjhi" },
  { id: "37", numero: "494762", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-03-03", url: "https://drive.google.com/drive/folders/1Z8JsIIU5My8r_wNuygkxHe-Vp9isR764" },
  { id: "38", numero: "494568", estado: "analisis", cia: "INTEGRITY", fecha: "2026-03-03", url: "https://drive.google.com/drive/folders/1x5MONVibri3F4FBQiyPwNDq3pm60IWc_" },
  { id: "39", numero: "494548", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-03-03", url: "https://drive.google.com/drive/folders/1C9Wj27qj6Mu5VAYonc08lPbG1ZrNPI1y" },
  { id: "40", numero: "494861", estado: "informe", cia: "INTEGRITY", fecha: "2026-02-27", url: "https://drive.google.com/drive/folders/1ELu7VjIO21PcAhXXGa5evPswtBQZlosw" },
  { id: "41", numero: "493761", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-02-27", url: "https://drive.google.com/drive/folders/1v8cMOnOjmwzcy8OEZJhSUMlTMBbIfzRn" },
  { id: "42", numero: "494535", estado: "cierre", cia: "INTEGRITY", fecha: "2026-02-27", url: "https://drive.google.com/drive/folders/1-EIVFeDmnrjCGIGhiKFWI5EXEJvp3DJi" },
  { id: "43", numero: "494403", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-02-26", url: "https://drive.google.com/drive/folders/1vJ5L8RxcbK_MfzJGtyIbT77R9tWxi7qZ" },
  { id: "44", numero: "494622B", estado: "documentacion", cia: "INTEGRITY", fecha: "2026-02-25", url: "https://drive.google.com/drive/folders/1tgBhLAwmuJXE54446nRTWGYuO9NV6jrM" },
  { id: "45", numero: "494627", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-02-24", url: "https://drive.google.com/drive/folders/1dTk5szgXxTT10vGu80snDTJ7rTJRaxCE" },
  { id: "46", numero: "494540", estado: "analisis", cia: "INTEGRITY", fecha: "2026-02-23", url: "https://drive.google.com/drive/folders/1xACnTg4QjDz_JaDFtsNe-3otyCM8Xysv" },
  { id: "47", numero: "494309", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-02-23", url: "https://drive.google.com/drive/folders/1gR1_AfmX0VeEqQ24EWck6vpmpuRp7WE4" },
  { id: "48", numero: "494551", estado: "oferta", cia: "INTEGRITY", fecha: "2026-02-23", url: "https://drive.google.com/drive/folders/13Ezd0PBxHQATsOo8gFEZKykruexyjZ-K" },
  { id: "49", numero: "493238", estado: "recepcion", cia: "INTEGRITY", fecha: "2026-02-19", url: "https://drive.google.com/drive/folders/1xaJBru47Jh3Bgzlf-P18E5a6uVI0wmzG" },
  { id: "50", numero: "493411", estado: "convenio", cia: "INTEGRITY", fecha: "2026-02-15", url: "https://drive.google.com/drive/folders/1abc123example" },
];

const ETAPAS = [
  { id: "recepcion", label: "Recepción", icon: "📥", color: "#64748b" },
  { id: "analisis", label: "Análisis", icon: "🔍", color: "#eab308" },
  { id: "informe", label: "Informe", icon: "📋", color: "#3b82f6" },
  { id: "oferta", label: "Oferta", icon: "💬", color: "#8b5cf6" },
  { id: "convenio", label: "Convenio", icon: "📝", color: "#06b6d4" },
  { id: "documentacion", label: "Documentación", icon: "📁", color: "#f97316" },
  { id: "cierre", label: "Cierre", icon: "✅", color: "#22c55e" },
];

const COMPANIAS = ["INTEGRITY", "SAN CRISTOBAL", "MAPFRE", "PROVINCIA", "GALENO"];

export default function AgendaSiniestros({ onAbrirDictamen }) {
  const [filtroCompania, setFiltroCompania] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const siniestrosFiltrados = useMemo(() => {
    return SINIESTROS.filter(s => {
      const matchCia = filtroCompania === "TODOS" || s.cia === filtroCompania;
      const matchEstado = !filtroEstado || s.estado === filtroEstado;
      const matchBusqueda = !busqueda || s.numero.includes(busqueda);
      return matchCia && matchEstado && matchBusqueda;
    });
  }, [filtroCompania, filtroEstado, busqueda]);

  const contadores = useMemo(() => {
    const base = SINIESTROS.filter(s => filtroCompania === "TODOS" || s.cia === filtroCompania);
    const result = {};
    ETAPAS.forEach(e => { result[e.id] = 0; });
    base.forEach(s => {
      if (result[s.estado] !== undefined) result[s.estado]++;
    });
    return result;
  }, [filtroCompania]);

  const getEtapa = (id) => ETAPAS.find(e => e.id === id) || ETAPAS[0];

  return (
    <div style={{ background: "#070b14", minHeight: "100vh", padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#60a5fa", fontSize: "20px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          ⚡ GIANOGLIO PERITACIONES
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ background: "#1e3a5f", border: "none", color: "#60a5fa", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
            🔄 Actualizar
          </button>
          <button style={{ background: "#3b82f6", border: "none", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
            + Nuevo
          </button>
        </div>
      </div>

      {/* Filtros compañía */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          onClick={() => setFiltroCompania("TODOS")}
          style={{
            background: filtroCompania === "TODOS" ? "#1e3a5f" : "transparent",
            border: "1px solid #1e3a5f",
            color: filtroCompania === "TODOS" ? "#60a5fa" : "#475569",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "11px"
          }}
        >
          📋 TODOS
        </button>
        {COMPANIAS.map(cia => (
          <button
            key={cia}
            onClick={() => setFiltroCompania(cia)}
            style={{
              background: filtroCompania === cia ? "#7c3aed22" : "transparent",
              border: filtroCompania === cia ? "1px solid #7c3aed" : "1px solid #1e3a5f",
              color: filtroCompania === cia ? "#a78bfa" : "#475569",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px"
            }}
          >
            {cia}
          </button>
        ))}
      </div>

      {/* Contadores de estados */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {ETAPAS.map(etapa => (
          <div
            key={etapa.id}
            onClick={() => setFiltroEstado(filtroEstado === etapa.id ? null : etapa.id)}
            style={{
              background: filtroEstado === etapa.id ? `${etapa.color}22` : "#0d1225",
              border: `1px solid ${filtroEstado === etapa.id ? etapa.color : "#1e3a5f"}`,
              borderRadius: "8px",
              padding: "12px 16px",
              textAlign: "center",
              cursor: "pointer",
              minWidth: "80px"
            }}
          >
            <div style={{ fontSize: "18px", marginBottom: "4px" }}>{etapa.icon}</div>
            <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px" }}>{etapa.label}</div>
            <div style={{ color: etapa.color, fontSize: "20px", fontWeight: "bold" }}>{contadores[etapa.id]}</div>
          </div>
        ))}
      </div>

      {/* Lista de siniestros */}
      {siniestrosFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#475569" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📁</div>
          <div>No hay siniestros.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
          {siniestrosFiltrados.map(s => {
            const etapa = getEtapa(s.estado);
            const dias = Math.floor((new Date() - new Date(s.fecha)) / (1000 * 60 * 60 * 24));
            
            return (
              <div
                key={s.id}
                onClick={() => window.open(s.url, "_blank")}
                style={{
                  background: "#0d1225",
                  border: "1px solid #1e3a5f",
                  borderRadius: "10px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  position: "relative"
                }}
              >
                <div style={{ position: "absolute", top: "0", right: "0", background: "#7c3aed", color: "white", fontSize: "9px", padding: "4px 8px", borderBottomLeftRadius: "8px", borderTopRightRadius: "9px" }}>
                  {s.cia}
                </div>
                
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#e2e8f0", marginBottom: "8px" }}>
                  #{s.numero}
                </div>
                
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `${etapa.color}22`, color: etapa.color, padding: "4px 10px", borderRadius: "4px", fontSize: "11px", marginBottom: "12px" }}>
                  {etapa.icon} {etapa.label}
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>
                    📅 {new Date(s.fecha).toLocaleDateString("es-AR")}
                  </div>
                  <div style={{
                    background: dias > 30 ? "#ef444433" : dias > 15 ? "#f59e0b33" : "#22c55e33",
                    color: dias > 30 ? "#ef4444" : dias > 15 ? "#f59e0b" : "#22c55e",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "bold"
                  }}>
                    {dias}d
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div style={{ textAlign: "center", marginTop: "30px", color: "#334155", fontSize: "11px" }}>
        Mostrando {siniestrosFiltrados.length} de {SINIESTROS.length} siniestros • Datos de Google Drive
      </div>
    </div>
  );
}
