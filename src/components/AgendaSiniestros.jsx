import { useState, useMemo } from "react";

// ============================================
// DATOS REALES DE GOOGLE DRIVE - INTEGRITY
// Actualizado: 14/04/2026
// ============================================

const detectarEstado = (titulo) => {
  const t = titulo.toUpperCase();
  if (t.includes("02F")) return "cierre";
  if (t.includes("01F") || t.includes("01 F")) return "informe";
  if (t.includes("TERC")) return "analisis";
  return "recepcion";
};

const SINIESTROS_RAW = [
  { id: "1NsMIfTHlU9-rDaUz2S6OJqui1d7yXIBQ", titulo: "493699 - 02F", fecha: "2026-04-12" },
  { id: "15XaQdAce5sOQGy1_tpCj159HcEGxtqOC", titulo: "492384 - 01 F", fecha: "2026-03-28" },
  { id: "1tuZeHN7ILstnr_PKRpOVNFLLJ0tnngRw", titulo: "495517", fecha: "2026-04-10" },
  { id: "15z2xfsh2VjwXj3rhosI8XSlg2DPVXZC4", titulo: "495644", fecha: "2026-04-10" },
  { id: "1DzaMHTN39Uv58K-rJvNlqrsN9ikf-vvP", titulo: "494570", fecha: "2026-04-10" },
  { id: "1OXl-wyUv68TbmwucHki78N2TM3unWY1v", titulo: "494915", fecha: "2026-04-10" },
  { id: "1OzleB5doQI5dVpgY4KZSwjjxG2EtL-8R", titulo: "495462", fecha: "2026-04-10" },
  { id: "1dktTGghOUxmdHy7pMGp9RddtJFo3_wXx", titulo: "495934", fecha: "2026-04-08" },
  { id: "1GRyCloWxm23kbXuzSoVT6cKVkUwGRdAE", titulo: "494934", fecha: "2026-04-08" },
  { id: "1GKz-dHRGvMgVxUqJ-_et8mSurKkLUfYU", titulo: "495114", fecha: "2026-04-06" },
  { id: "1VoQs1z2EJ7a7-Mn8DKCU2qcRZVBAVH_x", titulo: "495850", fecha: "2026-04-06" },
  { id: "19lWTDr3vDB6YqN8pDxiWmVJYD-BIdNed", titulo: "491406", fecha: "2026-01-17" },
  { id: "1mvfJDGdrVzsJ8q_i1O9PeucwqilMkg6W", titulo: "494794", fecha: "2026-04-03" },
  { id: "1JwN32y6TX9tKm-owIXArZKdnZP3HLnZp", titulo: "494681", fecha: "2026-03-31" },
  { id: "1QiZw0NLoywzygXU0rIpr3ckKOauOiw40", titulo: "463796", fecha: "2026-03-30" },
  { id: "1ufFuFmj0aIMsVXU65--W3O8GWmCwQsyK", titulo: "495113 - 01F", fecha: "2026-03-06" },
  { id: "1vuyMnbY_ul8K1_WzHpa7fKew02bjH7Eu", titulo: "494622 TERC", fecha: "2026-03-06" },
  { id: "1dlmUzcI4kqj3pSIAb7XnJjOT6X8GMjpH", titulo: "495726 - 01F", fecha: "2026-03-28" },
  { id: "1skKTVBkiMEewUjQpkcCfA4MmG53rBNVb", titulo: "493283", fecha: "2026-03-27" },
  { id: "1DvJuGQZCVzFWOY-RBKhpej4-fUnad1QI", titulo: "495049", fecha: "2026-03-26" },
  { id: "1kA33E3jEKI8Pk86T7Q6wqskRiXxEYc-2", titulo: "494864 - 01F", fecha: "2026-03-21" },
  { id: "1aaYZruerGrdEulbtXPajMMakWopSX3MQ", titulo: "494712", fecha: "2026-03-20" },
  { id: "1t93tw-w7_hrmQpdHf-dJA-tgo3m1uaMH", titulo: "493607", fecha: "2026-03-20" },
  { id: "1EVpGlt6XSM5YgEY96hkRkn6aVENVwQbi", titulo: "475116 - 01F", fecha: "2026-03-19" },
  { id: "1PMvHMLk9qDwZd0uQ5BwPYA5rzPn9HL_z", titulo: "494760 - 01 F", fecha: "2026-03-19" },
  { id: "1FELietClmmwgLlcvPMJDZwUB2_HsgSaO", titulo: "493298", fecha: "2026-03-17" },
  { id: "1g3CU-cMRrY-QGPeah3c3n2MJAwKD0dsL", titulo: "495111 - 01F", fecha: "2026-03-16" },
  { id: "1_3NjPKpHbtu74f3CMhh7ovPqy0OphGfX", titulo: "493251", fecha: "2026-03-13" },
  { id: "1PVpJfv0Tq6nyMv8kUW5EIuMy8DllXIA3", titulo: "492684", fecha: "2026-03-12" },
  { id: "1qpdafQ0bfdYI4ntPBkEkNVVlZ2xW8IiK", titulo: "494257", fecha: "2026-03-12" },
  { id: "1WwWV4ErE_rRJh4rLD8OC3Zaq1gkKfnJz", titulo: "491321 - 02F", fecha: "2026-03-12" },
  { id: "1mP4p6ZROHHKlQnp9yTE2aH8rmikS4vMc", titulo: "477235 - 01F", fecha: "2026-03-12" },
  { id: "1Kdk5uo3tNnA_iFQ-Rp5IRS4Kk79BRR33", titulo: "494937 - 01F", fecha: "2026-03-11" },
  { id: "1vYjQwqyOxK0bMw2SzR18BrowSYs3OHxi", titulo: "494565-02F", fecha: "2026-03-11" },
  { id: "1aJ-o3lCsEDEW8r3brAwbSzn3gbE2-tPl", titulo: "495019 - 01F", fecha: "2026-03-09" },
  { id: "1HF9vYFir1fZ5chYgjMVsXyrwi39MIaY5", titulo: "489762", fecha: "2026-03-09" },
  { id: "152-kikX4h3N7y9Jg9GEc0yEwX8QOa7OC", titulo: "494366 CITROEN", fecha: "2026-03-06" },
  { id: "13S8lc-vQfbLrxG4EvvHwG4F4OdmvyRub", titulo: "494366 - FIAT SIENA", fecha: "2026-03-06" },
  { id: "1zKiCMdQ94hbW9MSwMZKuHYhLe3O0Jf6Q", titulo: "494884 - 01F", fecha: "2026-03-06" },
  { id: "1idfmk8kiZyUftqJagv1ax-Ll11WqYPEj", titulo: "494810 - 01F", fecha: "2026-03-06" },
  { id: "1IoVDoxC7jS11T7UCUZ-4RxKZ2c2LOfQS", titulo: "494926", fecha: "2026-03-06" },
  { id: "1KGFk0eULPY2-k6NYvW9wEceOVjzdj1S3", titulo: "mot30892", fecha: "2026-03-06" },
  { id: "15nb8XRWsHhqQRuUF9T5iUWiZCPooxKFy", titulo: "493297", fecha: "2026-03-05" },
  { id: "1dqJaTyjgH5bG0V3--A0ZDGEGmi1RAjhi", titulo: "494023 TERC", fecha: "2026-03-04" },
  { id: "1Z8JsIIU5My8r_wNuygkxHe-Vp9isR764", titulo: "494762", fecha: "2026-03-03" },
  { id: "1x5MONVibri3F4FBQiyPwNDq3pm60IWc_", titulo: "494568", fecha: "2026-03-03" },
  { id: "1C9Wj27qj6Mu5VAYonc08lPbG1ZrNPI1y", titulo: "494548", fecha: "2026-03-03" },
  { id: "1ELu7VjIO21PcAhXXGa5evPswtBQZlosw", titulo: "494861", fecha: "2026-02-27" },
  { id: "1v8cMOnOjmwzcy8OEZJhSUMlTMBbIfzRn", titulo: "493761", fecha: "2026-02-27" },
  { id: "1-EIVFeDmnrjCGIGhiKFWI5EXEJvp3DJi", titulo: "494535", fecha: "2026-02-27" },
  { id: "1vJ5L8RxcbK_MfzJGtyIbT77R9tWxi7qZ", titulo: "494403", fecha: "2026-02-26" },
  { id: "1tgBhLAwmuJXE54446nRTWGYuO9NV6jrM", titulo: "494622", fecha: "2026-02-25" },
  { id: "1dTk5szgXxTT10vGu80snDTJ7rTJRaxCE", titulo: "494627", fecha: "2026-02-24" },
  { id: "1xACnTg4QjDz_JaDFtsNe-3otyCM8Xysv", titulo: "494540", fecha: "2026-02-23" },
  { id: "1gR1_AfmX0VeEqQ24EWck6vpmpuRp7WE4", titulo: "494309", fecha: "2026-02-23" },
  { id: "13Ezd0PBxHQATsOo8gFEZKykruexyjZ-K", titulo: "494551", fecha: "2026-02-23" },
  { id: "1xaJBru47Jh3Bgzlf-P18E5a6uVI0wmzG", titulo: "493238", fecha: "2026-02-19" },
  { id: "1yn7GTu7ksusq-H-YuwZaqr9X_l54NLrx", titulo: "493202", fecha: "2026-02-19" },
  { id: "1HMAlX7SMj9mfCXjVyErnTG1RluZMJG1u", titulo: "493214", fecha: "2026-02-18" },
  { id: "1Q2af5aelPax-nn3WCBoAuPV-x9l9EKCY", titulo: "494228", fecha: "2026-02-17" },
  { id: "1ueyCrQXR0hiT1z2PELmRwYoJrKNj6ywJ", titulo: "494298", fecha: "2026-02-16" },
  { id: "1EgraQIKOILk0tjQ_MgTuoUXFn9p_S7SW", titulo: "493621 TERC", fecha: "2026-02-16" },
  { id: "1jmaT5-ZESPYpG0GIpZx4a5QUAY3meG7W", titulo: "494336 TERC", fecha: "2026-02-16" },
  { id: "18ml08QhBIYuVIPjMY-T5WBtDHhozEUed", titulo: "494336", fecha: "2026-02-16" },
  { id: "1IJHiRG8a-fDF0XZvSTy_mIeNr9OHjYvP", titulo: "494462", fecha: "2026-02-16" },
  { id: "1mP4rUILxB79p0mpblrzd-iEDz_bd8m9b", titulo: "492678", fecha: "2026-02-13" },
  { id: "16SNIr4tmTiMF-Ip5s93duSZ3UVh1xUAF", titulo: "494252", fecha: "2026-02-12" },
  { id: "1Pm_lMoclYou472Ac1B9zy0Mb9s1tKq3V", titulo: "493633", fecha: "2026-02-11" },
  { id: "17oX74xZG4elcuL6ScsbPGeRPqDYbc6N-", titulo: "493430", fecha: "2026-02-11" },
  { id: "10FXmUuSy0em7ero6TBBkE_kMovLn_USS", titulo: "493295", fecha: "2026-02-11" },
  { id: "1JcfI0g0l0y0C2TJjxFg30kiTbHm3-qvI", titulo: "494352", fecha: "2026-02-09" },
  { id: "1zB4yFzlBThcU6v4quaiDZURacJu8JYsf", titulo: "484228", fecha: "2026-02-09" },
  { id: "1mM29cK0hhh5-kKcifYDeae20oLdCJPSV", titulo: "494243", fecha: "2026-02-09" },
  { id: "19bXskfLzWDTcqYigN58wkVtnpxnmRkDR", titulo: "494213", fecha: "2026-02-09" },
  { id: "1jCrcMcl1xRIUP7zLo1xzLB2pq8AkrNYH", titulo: "493912", fecha: "2026-02-09" },
  { id: "1b74P2XX87igK-j2MI7K2ttP6qVaAhsf1", titulo: "493336 terc", fecha: "2026-02-09" },
  { id: "1_i1mzggoZvlTa_yXzyqLPuULZdpQO5Ay", titulo: "493206", fecha: "2026-02-07" },
  { id: "12QS1dphtj-qs7zN4fAmbBwOeq9t36QXf", titulo: "494002", fecha: "2026-02-06" },
  { id: "1bzjnWwAYPbT-s-AyCnmCyawROfKxVWf5", titulo: "494115", fecha: "2026-02-06" },
  { id: "1HUppfxySvL-J6XS0Tb831gdcoxHtlx3R", titulo: "493944", fecha: "2026-02-06" },
  { id: "16WIAC8hTg8MbvJ8W6ILdUbFLfwunbyPX", titulo: "493543", fecha: "2026-02-06" },
  { id: "1fMGazTdb5-Z4yDX48JNmzDSBu5CMBtm4", titulo: "493276", fecha: "2026-02-05" },
  { id: "1loqqm0dVplIWSeR-Fg6EBWgCc7pJ9Kj0", titulo: "493794", fecha: "2026-02-04" },
  { id: "1KmqHvcOXAMCSCFXdlQD0AbUSkHjkGhKO", titulo: "494023", fecha: "2026-02-04" },
  { id: "17oBI4zUN-v7NtSFTIc0_Lc5E3xH9Ulc2", titulo: "493983", fecha: "2026-02-04" },
  { id: "1KP-tEsYrTo5AiTO8yXWOoJ7iwP4imxUd", titulo: "493174", fecha: "2026-02-04" },
  { id: "1_gtZBuqyCdnVD70HvULCcV3LuFJHb5KO", titulo: "493257", fecha: "2026-02-02" },
  { id: "1djmeFCpbAJWQSbaBuSvAkol1YaVuqOVH", titulo: "493518", fecha: "2026-01-30" },
  { id: "1UjKJnlwqLU8BiPQFigHTtS5em_-TcBMs", titulo: "493849", fecha: "2026-01-30" },
  { id: "1-gtvL8oeaRqYGyOIzNWmFbkJ4DrY7i5W", titulo: "492604", fecha: "2026-01-30" },
  { id: "1MbPT-leMpxZwuDCS1nFBUmF-0lToq71i", titulo: "493691", fecha: "2026-01-30" },
  { id: "18557GW-VD2HWqDf2Q_puTfS_ME5CV4m-", titulo: "492251", fecha: "2026-01-29" },
  { id: "1KpofkEsEV2WW22M6IKxVH-lYjtpahz4U", titulo: "492231", fecha: "2026-01-29" },
  { id: "16aj1bMpq3NnYvpyE-8hb0lsIkd1ZG5Qd", titulo: "493790", fecha: "2026-01-29" },
  { id: "1qXxfTyr2pQ6qKiB4l2gf8iMFexDx6qhj", titulo: "493621", fecha: "2026-01-29" },
  { id: "1KkJ3wyvl7O0JYRwGJbvqva_TqZNc7N1I", titulo: "493846", fecha: "2026-01-28" },
];

// Procesar siniestros
const SINIESTROS = SINIESTROS_RAW.map(s => ({
  ...s,
  numero: s.titulo.split(" ")[0].replace("-", ""),
  estado: detectarEstado(s.titulo),
  cia: "INTEGRITY",
  url: `https://drive.google.com/drive/folders/${s.id}`
}));

// Configuración de estados
const ESTADOS = {
  recepcion: { label: "Recepción", color: "#64748b", icon: "📥" },
  analisis: { label: "Análisis", color: "#8b5cf6", icon: "⚖️" },
  informe: { label: "Informe", color: "#3b82f6", icon: "📋" },
  oferta: { label: "Oferta", color: "#06b6d4", icon: "💬" },
  convenio: { label: "Convenio", color: "#10b981", icon: "📝" },
  documentacion: { label: "Documentación", color: "#f59e0b", icon: "📂" },
  cierre: { label: "Cierre", color: "#22c55e", icon: "✅" }
};

// Colores por compañía
const COMPANIAS = {
  INTEGRITY: { color: "#7c3aed", bg: "#f5f3ff" },
  GALENO: { color: "#00a651", bg: "#ecfdf5" },
  MAPFRE: { color: "#dc2626", bg: "#fef2f2" },
  PROVINCIA: { color: "#2563eb", bg: "#eff6ff" },
  "SAN CRISTOBAL": { color: "#ea580c", bg: "#fff7ed" }
};

// Calcular días transcurridos
const calcularDias = (fecha) => {
  const hoy = new Date();
  const fechaSiniestro = new Date(fecha);
  const diff = Math.floor((hoy - fechaSiniestro) / (1000 * 60 * 60 * 24));
  return diff;
};

const colorDias = (dias) => {
  if (dias < 15) return "#22c55e";
  if (dias < 30) return "#eab308";
  return "#ef4444";
};

export default function AgendaSiniestros({ onAbrirDictamen }) {
  const [filtroCompania, setFiltroCompania] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [siniestroSeleccionado, setSiniestroSeleccionado] = useState(null);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [siniestrosLocales, setSiniestrosLocales] = useState(SINIESTROS);

  // Filtrar siniestros
  const siniestrosFiltrados = useMemo(() => {
    return siniestrosLocales.filter(s => {
      if (filtroCompania !== "TODOS" && s.cia !== filtroCompania) return false;
      if (filtroEstado && s.estado !== filtroEstado) return false;
      if (busqueda && !s.numero.includes(busqueda) && !s.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [siniestrosLocales, filtroCompania, filtroEstado, busqueda]);

  // Contar por estado
  const contadores = useMemo(() => {
    const datos = filtroCompania === "TODOS" ? siniestrosLocales : siniestrosLocales.filter(s => s.cia === filtroCompania);
    const cont = {};
    Object.keys(ESTADOS).forEach(e => cont[e] = 0);
    datos.forEach(s => cont[s.estado] = (cont[s.estado] || 0) + 1);
    return cont;
  }, [siniestrosLocales, filtroCompania]);

  // Cambiar estado de un siniestro
  const cambiarEstado = (nuevoEstado) => {
    if (!siniestroSeleccionado) return;
    setSiniestrosLocales(prev => prev.map(s => 
      s.id === siniestroSeleccionado.id ? { ...s, estado: nuevoEstado } : s
    ));
    setSiniestroSeleccionado(prev => ({ ...prev, estado: nuevoEstado }));
    setMostrarModalEstado(false);
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "18px"
          }}>G</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
              Agenda de Siniestros
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Gianoglio Peritaciones
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Buscar siniestro..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "14px",
              width: "200px",
              outline: "none"
            }}
          />
          <span style={{ 
            padding: "8px 16px", 
            backgroundColor: "#f1f5f9", 
            borderRadius: "8px",
            fontSize: "14px",
            color: "#475569"
          }}>
            {siniestrosFiltrados.length} siniestros
          </span>
        </div>
      </header>

      {/* Filtros por compañía */}
      <div style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "12px 24px",
        display: "flex",
        gap: "8px",
        overflowX: "auto"
      }}>
        {["TODOS", "INTEGRITY", "GALENO", "SAN CRISTOBAL", "MAPFRE", "PROVINCIA"].map(cia => (
          <button
            key={cia}
            onClick={() => { setFiltroCompania(cia); setFiltroEstado(null); }}
            style={{
              padding: "8px 20px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
              backgroundColor: filtroCompania === cia 
                ? (cia === "TODOS" ? "#1e293b" : COMPANIAS[cia]?.color || "#1e293b")
                : "#f1f5f9",
              color: filtroCompania === cia ? "#ffffff" : "#475569"
            }}
          >
            {cia}
          </button>
        ))}
      </div>

      {/* Contadores de estados */}
      <div style={{
        padding: "16px 24px",
        display: "flex",
        gap: "12px",
        overflowX: "auto"
      }}>
        {Object.entries(ESTADOS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFiltroEstado(filtroEstado === key ? null : key)}
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border: filtroEstado === key ? `2px solid ${val.color}` : "1px solid #e2e8f0",
              backgroundColor: filtroEstado === key ? `${val.color}15` : "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: "fit-content"
            }}
          >
            <span style={{ fontSize: "18px" }}>{val.icon}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: val.color }}>
                {contadores[key] || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{val.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Grid de siniestros */}
      <div style={{
        padding: "0 24px 24px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px"
      }}>
        {siniestrosFiltrados.map(siniestro => {
          const dias = calcularDias(siniestro.fecha);
          const estadoInfo = ESTADOS[siniestro.estado];
          const ciaInfo = COMPANIAS[siniestro.cia] || { color: "#64748b", bg: "#f1f5f9" };
          
          return (
            <div
              key={siniestro.id}
              onClick={() => setSiniestroSeleccionado(siniestro)}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: siniestroSeleccionado?.id === siniestro.id 
                  ? `2px solid ${ciaInfo.color}` 
                  : "1px solid #e2e8f0",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: siniestroSeleccionado?.id === siniestro.id 
                  ? "0 4px 12px rgba(0,0,0,0.1)" 
                  : "none"
              }}
            >
              {/* Header de tarjeta */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b" }}>
                    #{siniestro.numero}
                  </div>
                  <div style={{ 
                    fontSize: "11px", 
                    color: ciaInfo.color,
                    fontWeight: "600",
                    marginTop: "2px"
                  }}>
                    {siniestro.cia}
                  </div>
                </div>
                <div style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  backgroundColor: `${estadoInfo.color}15`,
                  color: estadoInfo.color,
                  fontSize: "12px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <span>{estadoInfo.icon}</span>
                  {estadoInfo.label}
                </div>
              </div>

              {/* Info adicional */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                paddingTop: "12px",
                borderTop: "1px solid #f1f5f9"
              }}>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  {new Date(siniestro.fecha).toLocaleDateString("es-AR")}
                </div>
                <div style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  backgroundColor: `${colorDias(dias)}15`,
                  color: colorDias(dias),
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {dias} días
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel lateral de detalle */}
      {siniestroSeleccionado && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "400px",
          height: "100vh",
          backgroundColor: "#ffffff",
          borderLeft: "1px solid #e2e8f0",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
          padding: "24px",
          overflowY: "auto",
          zIndex: 1000
        }}>
          {/* Cerrar */}
          <button
            onClick={() => setSiniestroSeleccionado(null)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#f1f5f9",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            ✕
          </button>

          {/* Contenido */}
          <div style={{ marginTop: "32px" }}>
            <div style={{ 
              fontSize: "12px", 
              color: COMPANIAS[siniestroSeleccionado.cia]?.color,
              fontWeight: "600",
              marginBottom: "4px"
            }}>
              {siniestroSeleccionado.cia}
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: "700", color: "#1e293b" }}>
              Siniestro #{siniestroSeleccionado.numero}
            </h2>
            <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px" }}>
              {siniestroSeleccionado.titulo}
            </p>

            {/* Estado actual */}
            <div style={{
              padding: "16px",
              backgroundColor: `${ESTADOS[siniestroSeleccionado.estado].color}10`,
              borderRadius: "12px",
              marginBottom: "16px"
            }}>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Estado actual</div>
              <div style={{ 
                fontSize: "18px", 
                fontWeight: "600", 
                color: ESTADOS[siniestroSeleccionado.estado].color,
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span>{ESTADOS[siniestroSeleccionado.estado].icon}</span>
                {ESTADOS[siniestroSeleccionado.estado].label}
              </div>
            </div>

            {/* Info */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "12px",
              marginBottom: "24px"
            }}>
              <div style={{ 
                padding: "12px", 
                backgroundColor: "#f8fafc", 
                borderRadius: "8px" 
              }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Fecha</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                  {new Date(siniestroSeleccionado.fecha).toLocaleDateString("es-AR")}
                </div>
              </div>
              <div style={{ 
                padding: "12px", 
                backgroundColor: "#f8fafc", 
                borderRadius: "8px" 
              }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Días</div>
                <div style={{ 
                  fontSize: "14px", 
                  fontWeight: "600", 
                  color: colorDias(calcularDias(siniestroSeleccionado.fecha))
                }}>
                  {calcularDias(siniestroSeleccionado.fecha)} días
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Abrir en Drive */}
              <button
                onClick={() => window.open(siniestroSeleccionado.url, "_blank")}
                style={{
                  padding: "14px 20px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                📁 Abrir en Drive
              </button>

              {/* Dictamen IA */}
              <button
                onClick={() => {
                  if (onAbrirDictamen) {
                    onAbrirDictamen(siniestroSeleccionado);
                  } else {
                    alert("Función de Dictamen IA - En desarrollo");
                  }
                }}
                style={{
                  padding: "14px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                ⚖️ Dictamen IA
              </button>

              {/* Cambiar estado */}
              <button
                onClick={() => setMostrarModalEstado(true)}
                style={{
                  padding: "14px 20px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                🔄 Cambiar Estado
              </button>
            </div>

            {/* Flujo de trabajo */}
            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "12px" }}>
                Flujo de trabajo
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(ESTADOS).map(([key, val], idx) => {
                  const esActual = key === siniestroSeleccionado.estado;
                  const esPasado = Object.keys(ESTADOS).indexOf(key) < Object.keys(ESTADOS).indexOf(siniestroSeleccionado.estado);
                  
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        backgroundColor: esActual ? `${val.color}15` : "transparent",
                        border: esActual ? `1px solid ${val.color}30` : "1px solid transparent"
                      }}
                    >
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: esPasado || esActual ? val.color : "#e2e8f0",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px"
                      }}>
                        {esPasado ? "✓" : (idx + 1)}
                      </div>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: esActual ? "600" : "400",
                        color: esActual ? val.color : (esPasado ? "#64748b" : "#94a3b8")
                      }}>
                        {val.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar estado */}
      {mostrarModalEstado && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            width: "400px",
            maxWidth: "90vw"
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "600" }}>
              Cambiar estado
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(ESTADOS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => cambiarEstado(key)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: siniestroSeleccionado?.estado === key 
                      ? `2px solid ${val.color}` 
                      : "1px solid #e2e8f0",
                    backgroundColor: siniestroSeleccionado?.estado === key 
                      ? `${val.color}10` 
                      : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textAlign: "left"
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{val.icon}</span>
                  <span style={{ 
                    fontSize: "14px", 
                    fontWeight: "500",
                    color: val.color 
                  }}>
                    {val.label}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMostrarModalEstado(false)}
              style={{
                marginTop: "16px",
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
