import { useState, useMemo } from "react";

// DATOS REALES DE GOOGLE DRIVE - Actualizado 14/04/2026
const SINIESTROS_REALES = [
  // INTEGRITY - 50 siniestros reales
  { id: "1NsMIfTHlU9-rDaUz2S6OJqui1d7yXIBQ", numero: "493699", estado: "02F", cia: "INTEGRITY", fecha: "2026-04-12", url: "https://drive.google.com/drive/folders/1NsMIfTHlU9-rDaUz2S6OJqui1d7yXIBQ" },
  { id: "1tuZeHN7ILstnr_PKRpOVNFLLJ0tnngRw", numero: "495517", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/1tuZeHN7ILstnr_PKRpOVNFLLJ0tnngRw" },
  { id: "15z2xfsh2VjwXj3rhosI8XSlg2DPVXZC4", numero: "495644", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/15z2xfsh2VjwXj3rhosI8XSlg2DPVXZC4" },
  { id: "1DzaMHTN39Uv58K-rJvNlqrsN9ikf-vvP", numero: "494570", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/1DzaMHTN39Uv58K-rJvNlqrsN9ikf-vvP" },
  { id: "1OXl-wyUv68TbmwucHki78N2TM3unWY1v", numero: "494915", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/1OXl-wyUv68TbmwucHki78N2TM3unWY1v" },
  { id: "1OzleB5doQI5dVpgY4KZSwjjxG2EtL-8R", numero: "495462", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-10", url: "https://drive.google.com/drive/folders/1OzleB5doQI5dVpgY4KZSwjjxG2EtL-8R" },
  { id: "1dktTGghOUxmdHy7pMGp9RddtJFo3_wXx", numero: "495934", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-08", url: "https://drive.google.com/drive/folders/1dktTGghOUxmdHy7pMGp9RddtJFo3_wXx" },
  { id: "1GRyCloWxm23kbXuzSoVT6cKVkUwGRdAE", numero: "494934", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-08", url: "https://drive.google.com/drive/folders/1GRyCloWxm23kbXuzSoVT6cKVkUwGRdAE" },
  { id: "1GKz-dHRGvMgVxUqJ-_et8mSurKkLUfYU", numero: "495114", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-06", url: "https://drive.google.com/drive/folders/1GKz-dHRGvMgVxUqJ-_et8mSurKkLUfYU" },
  { id: "1VoQs1z2EJ7a7-Mn8DKCU2qcRZVBAVH_x", numero: "495850", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-06", url: "https://drive.google.com/drive/folders/1VoQs1z2EJ7a7-Mn8DKCU2qcRZVBAVH_x" },
  { id: "1mvfJDGdrVzsJ8q_i1O9PeucwqilMkg6W", numero: "494794", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-04-03", url: "https://drive.google.com/drive/folders/1mvfJDGdrVzsJ8q_i1O9PeucwqilMkg6W" },
  { id: "1JwN32y6TX9tKm-owIXArZKdnZP3HLnZp", numero: "494681", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-31", url: "https://drive.google.com/drive/folders/1JwN32y6TX9tKm-owIXArZKdnZP3HLnZp" },
  { id: "1ufFuFmj0aIMsVXU65--W3O8GWmCwQsyK", numero: "495113", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1ufFuFmj0aIMsVXU65--W3O8GWmCwQsyK" },
  { id: "1vuyMnbY_ul8K1_WzHpa7fKew02bjH7Eu", numero: "494622", estado: "TERC", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1vuyMnbY_ul8K1_WzHpa7fKew02bjH7Eu" },
  { id: "1dlmUzcI4kqj3pSIAb7XnJjOT6X8GMjpH", numero: "495726", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-28", url: "https://drive.google.com/drive/folders/1dlmUzcI4kqj3pSIAb7XnJjOT6X8GMjpH" },
  { id: "15XaQdAce5sOQGy1_tpCj159HcEGxtqOC", numero: "492384", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-28", url: "https://drive.google.com/drive/folders/15XaQdAce5sOQGy1_tpCj159HcEGxtqOC" },
  { id: "1skKTVBkiMEewUjQpkcCfA4MmG53rBNVb", numero: "493283", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-27", url: "https://drive.google.com/drive/folders/1skKTVBkiMEewUjQpkcCfA4MmG53rBNVb" },
  { id: "1DvJuGQZCVzFWOY-RBKhpej4-fUnad1QI", numero: "495049", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-26", url: "https://drive.google.com/drive/folders/1DvJuGQZCVzFWOY-RBKhpej4-fUnad1QI" },
  { id: "1kA33E3jEKI8Pk86T7Q6wqskRiXxEYc-2", numero: "494864", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-21", url: "https://drive.google.com/drive/folders/1kA33E3jEKI8Pk86T7Q6wqskRiXxEYc-2" },
  { id: "1aaYZruerGrdEulbtXPajMMakWopSX3MQ", numero: "494712", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-20", url: "https://drive.google.com/drive/folders/1aaYZruerGrdEulbtXPajMMakWopSX3MQ" },
  { id: "1t93tw-w7_hrmQpdHf-dJA-tgo3m1uaMH", numero: "493607", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-20", url: "https://drive.google.com/drive/folders/1t93tw-w7_hrmQpdHf-dJA-tgo3m1uaMH" },
  { id: "1PMvHMLk9qDwZd0uQ5BwPYA5rzPn9HL_z", numero: "494760", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-19", url: "https://drive.google.com/drive/folders/1PMvHMLk9qDwZd0uQ5BwPYA5rzPn9HL_z" },
  { id: "1FELietClmmwgLlcvPMJDZwUB2_HsgSaO", numero: "493298", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-17", url: "https://drive.google.com/drive/folders/1FELietClmmwgLlcvPMJDZwUB2_HsgSaO" },
  { id: "1g3CU-cMRrY-QGPeah3c3n2MJAwKD0dsL", numero: "495111", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-16", url: "https://drive.google.com/drive/folders/1g3CU-cMRrY-QGPeah3c3n2MJAwKD0dsL" },
  { id: "1_3NjPKpHbtu74f3CMhh7ovPqy0OphGfX", numero: "493251", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-13", url: "https://drive.google.com/drive/folders/1_3NjPKpHbtu74f3CMhh7ovPqy0OphGfX" },
  { id: "1PVpJfv0Tq6nyMv8kUW5EIuMy8DllXIA3", numero: "492684", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-12", url: "https://drive.google.com/drive/folders/1PVpJfv0Tq6nyMv8kUW5EIuMy8DllXIA3" },
  { id: "1qpdafQ0bfdYI4ntPBkEkNVVlZ2xW8IiK", numero: "494257", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-12", url: "https://drive.google.com/drive/folders/1qpdafQ0bfdYI4ntPBkEkNVVlZ2xW8IiK" },
  { id: "1Kdk5uo3tNnA_iFQ-Rp5IRS4Kk79BRR33", numero: "494937", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-11", url: "https://drive.google.com/drive/folders/1Kdk5uo3tNnA_iFQ-Rp5IRS4Kk79BRR33" },
  { id: "1vYjQwqyOxK0bMw2SzR18BrowSYs3OHxi", numero: "494565", estado: "02F", cia: "INTEGRITY", fecha: "2026-03-11", url: "https://drive.google.com/drive/folders/1vYjQwqyOxK0bMw2SzR18BrowSYs3OHxi" },
  { id: "1aJ-o3lCsEDEW8r3brAwbSzn3gbE2-tPl", numero: "495019", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-09", url: "https://drive.google.com/drive/folders/1aJ-o3lCsEDEW8r3brAwbSzn3gbE2-tPl" },
  { id: "152-kikX4h3N7y9Jg9GEc0yEwX8QOa7OC", numero: "494366", estado: "CITROEN", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/152-kikX4h3N7y9Jg9GEc0yEwX8QOa7OC" },
  { id: "13S8lc-vQfbLrxG4EvvHwG4F4OdmvyRub", numero: "494366", estado: "FIAT SIENA", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/13S8lc-vQfbLrxG4EvvHwG4F4OdmvyRub" },
  { id: "1zKiCMdQ94hbW9MSwMZKuHYhLe3O0Jf6Q", numero: "494884", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1zKiCMdQ94hbW9MSwMZKuHYhLe3O0Jf6Q" },
  { id: "1idfmk8kiZyUftqJagv1ax-Ll11WqYPEj", numero: "494810", estado: "01F", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1idfmk8kiZyUftqJagv1ax-Ll11WqYPEj" },
  { id: "1IoVDoxC7jS11T7UCUZ-4RxKZ2c2LOfQS", numero: "494926", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-06", url: "https://drive.google.com/drive/folders/1IoVDoxC7jS11T7UCUZ-4RxKZ2c2LOfQS" },
  { id: "15nb8XRWsHhqQRuUF9T5iUWiZCPooxKFy", numero: "493297", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-05", url: "https://drive.google.com/drive/folders/15nb8XRWsHhqQRuUF9T5iUWiZCPooxKFy" },
  { id: "1dqJaTyjgH5bG0V3--A0ZDGEGmi1RAjhi", numero: "494023", estado: "TERC", cia: "INTEGRITY", fecha: "2026-03-04", url: "https://drive.google.com/drive/folders/1dqJaTyjgH5bG0V3--A0ZDGEGmi1RAjhi" },
  { id: "1Z8JsIIU5My8r_wNuygkxHe-Vp9isR764", numero: "494762", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-03", url: "https://drive.google.com/drive/folders/1Z8JsIIU5My8r_wNuygkxHe-Vp9isR764" },
  { id: "1x5MONVibri3F4FBQiyPwNDq3pm60IWc_", numero: "494568", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-03", url: "https://drive.google.com/drive/folders/1x5MONVibri3F4FBQiyPwNDq3pm60IWc_" },
  { id: "1C9Wj27qj6Mu5VAYonc08lPbG1ZrNPI1y", numero: "494548", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-03-03", url: "https://drive.google.com/drive/folders/1C9Wj27qj6Mu5VAYonc08lPbG1ZrNPI1y" },
  { id: "1ELu7VjIO21PcAhXXGa5evPswtBQZlosw", numero: "494861", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-27", url: "https://drive.google.com/drive/folders/1ELu7VjIO21PcAhXXGa5evPswtBQZlosw" },
  { id: "1v8cMOnOjmwzcy8OEZJhSUMlTMBbIfzRn", numero: "493761", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-27", url: "https://drive.google.com/drive/folders/1v8cMOnOjmwzcy8OEZJhSUMlTMBbIfzRn" },
  { id: "1-EIVFeDmnrjCGIGhiKFWI5EXEJvp3DJi", numero: "494535", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-27", url: "https://drive.google.com/drive/folders/1-EIVFeDmnrjCGIGhiKFWI5EXEJvp3DJi" },
  { id: "1vJ5L8RxcbK_MfzJGtyIbT77R9tWxi7qZ", numero: "494403", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-26", url: "https://drive.google.com/drive/folders/1vJ5L8RxcbK_MfzJGtyIbT77R9tWxi7qZ" },
  { id: "1tgBhLAwmuJXE54446nRTWGYuO9NV6jrM", numero: "494622", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-25", url: "https://drive.google.com/drive/folders/1tgBhLAwmuJXE54446nRTWGYuO9NV6jrM" },
  { id: "1dTk5szgXxTT10vGu80snDTJ7rTJRaxCE", numero: "494627", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-24", url: "https://drive.google.com/drive/folders/1dTk5szgXxTT10vGu80snDTJ7rTJRaxCE" },
  { id: "1xACnTg4QjDz_JaDFtsNe-3otyCM8Xysv", numero: "494540", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-23", url: "https://drive.google.com/drive/folders/1xACnTg4QjDz_JaDFtsNe-3otyCM8Xysv" },
  { id: "1gR1_AfmX0VeEqQ24EWck6vpmpuRp7WE4", numero: "494309", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-23", url: "https://drive.google.com/drive/folders/1gR1_AfmX0VeEqQ24EWck6vpmpuRp7WE4" },
  { id: "13Ezd0PBxHQATsOo8gFEZKykruexyjZ-K", numero: "494551", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-23", url: "https://drive.google.com/drive/folders/13Ezd0PBxHQATsOo8gFEZKykruexyjZ-K" },
  { id: "1xaJBru47Jh3Bgzlf-P18E5a6uVI0wmzG", numero: "493238", estado: "RECEPCION", cia: "INTEGRITY", fecha: "2026-02-19", url: "https://drive.google.com/drive/folders/1xaJBru47Jh3Bgzlf-P18E5a6uVI0wmzG" },
];

const COMPANIAS = {
  INTEGRITY: { color: "#7c3aed", nombre: "Integrity Seguros" },
  GALENO: { color: "#00a651", nombre: "Galeno" },
  MAPFRE: { color: "#dc2626", nombre: "Mapfre" },
  PROVINCIA: { color: "#2563eb", nombre: "Provincia Seguros" },
  SAN_CRISTOBAL: { color: "#ea580c", nombre: "San Cristóbal" },
};

const ESTADOS = {
  "RECEPCION": { color: "#64748b", label: "Recepción", icon: "📥" },
  "01F": { color: "#f59e0b", label: "Informe", icon: "📋" },
  "02F": { color: "#10b981", label: "Cerrado", icon: "✅" },
  "TERC": { color: "#8b5cf6", label: "Tercero", icon: "👥" },
};

function calcularDias(fecha) {
  const hoy = new Date();
  const fechaStro = new Date(fecha);
  const diff = Math.floor((hoy - fechaStro) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function AgendaSiniestros() {
  const [filtroCompania, setFiltroCompania] = useState("TODAS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  const siniestrosFiltrados = useMemo(() => {
    return SINIESTROS_REALES.filter(s => {
      const matchCia = filtroCompania === "TODAS" || s.cia === filtroCompania;
      const matchEstado = filtroEstado === "TODOS" || s.estado === filtroEstado;
      const matchBusqueda = !busqueda || s.numero.includes(busqueda);
      return matchCia && matchEstado && matchBusqueda;
    });
  }, [filtroCompania, filtroEstado, busqueda]);

  const contadores = useMemo(() => {
    const porEstado = {};
    SINIESTROS_REALES.forEach(s => {
      porEstado[s.estado] = (porEstado[s.estado] || 0) + 1;
    });
    return porEstado;
  }, []);

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#e2e8f0",
      padding: "20px"
    }}>
      {/* Header */}
      <div style={{ 
        background: "rgba(30, 41, 59, 0.8)", 
        borderRadius: "16px", 
        padding: "24px",
        marginBottom: "20px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(148, 163, 184, 0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0, background: "linear-gradient(90deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              📋 Agenda de Siniestros
            </h1>
            <p style={{ color: "#94a3b8", margin: "8px 0 0", fontSize: "14px" }}>
              {SINIESTROS_REALES.length} siniestros en total • Datos reales de Google Drive
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {Object.entries(contadores).slice(0, 4).map(([estado, count]) => (
              <div key={estado} style={{
                background: `${ESTADOS[estado]?.color || "#64748b"}22`,
                border: `1px solid ${ESTADOS[estado]?.color || "#64748b"}44`,
                borderRadius: "8px",
                padding: "8px 16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "20px", fontWeight: "700" }}>{count}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>{ESTADOS[estado]?.label || estado}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        marginBottom: "20px", 
        flexWrap: "wrap" 
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar N° siniestro..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            background: "rgba(30, 41, 59, 0.8)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "#e2e8f0",
            fontSize: "14px",
            width: "200px",
            outline: "none"
          }}
        />
        <select
          value={filtroCompania}
          onChange={(e) => setFiltroCompania(e.target.value)}
          style={{
            background: "rgba(30, 41, 59, 0.8)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "#e2e8f0",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          <option value="TODAS">Todas las compañías</option>
          {Object.entries(COMPANIAS).map(([key, val]) => (
            <option key={key} value={key}>{val.nombre}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{
            background: "rgba(30, 41, 59, 0.8)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "#e2e8f0",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          <option value="TODOS">Todos los estados</option>
          {Object.entries(ESTADOS).map(([key, val]) => (
            <option key={key} value={key}>{val.icon} {val.label}</option>
          ))}
        </select>
      </div>

      {/* Grid de siniestros */}
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: seleccionado ? "0 0 60%" : "1", transition: "all 0.3s ease" }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
            gap: "12px" 
          }}>
            {siniestrosFiltrados.map((s) => {
              const dias = calcularDias(s.fecha);
              const estadoInfo = ESTADOS[s.estado] || ESTADOS["RECEPCION"];
              const ciaInfo = COMPANIAS[s.cia];
              const isSelected = seleccionado?.id === s.id;
              
              return (
                <div
                  key={s.id}
                  onClick={() => setSeleccionado(isSelected ? null : s)}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(135deg, ${ciaInfo.color}22 0%, ${ciaInfo.color}11 100%)`
                      : "rgba(30, 41, 59, 0.6)",
                    border: `2px solid ${isSelected ? ciaInfo.color : "rgba(148, 163, 184, 0.1)"}`,
                    borderRadius: "12px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Badge compañía */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: ciaInfo.color,
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "600",
                    padding: "4px 10px",
                    borderBottomLeftRadius: "8px"
                  }}>
                    {s.cia}
                  </div>

                  {/* Número */}
                  <div style={{ fontSize: "22px", fontWeight: "700", color: "#f1f5f9", marginBottom: "8px" }}>
                    #{s.numero}
                  </div>

                  {/* Estado */}
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: `${estadoInfo.color}22`,
                    color: estadoInfo.color,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "12px"
                  }}>
                    {estadoInfo.icon} {estadoInfo.label}
                  </div>

                  {/* Info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                      📅 {new Date(s.fecha).toLocaleDateString('es-AR')}
                    </div>
                    <div style={{
                      background: dias > 30 ? "#ef444422" : dias > 15 ? "#f59e0b22" : "#10b98122",
                      color: dias > 30 ? "#ef4444" : dias > 15 ? "#f59e0b" : "#10b981",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "600"
                    }}>
                      {dias}d
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel derecho - Detalle */}
        {seleccionado && (
          <div style={{
            flex: "0 0 38%",
            background: "rgba(30, 41, 59, 0.9)",
            borderRadius: "16px",
            padding: "24px",
            border: `2px solid ${COMPANIAS[seleccionado.cia].color}44`,
            position: "sticky",
            top: "20px",
            height: "fit-content"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>SINIESTRO</div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#f1f5f9" }}>#{seleccionado.numero}</div>
              </div>
              <button
                onClick={() => setSeleccionado(null)}
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "none",
                  color: "#ef4444",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "18px"
                }}
              >✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ 
                background: `${COMPANIAS[seleccionado.cia].color}22`,
                padding: "16px",
                borderRadius: "12px",
                borderLeft: `4px solid ${COMPANIAS[seleccionado.cia].color}`
              }}>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>COMPAÑÍA</div>
                <div style={{ fontSize: "18px", fontWeight: "600", color: COMPANIAS[seleccionado.cia].color }}>
                  {COMPANIAS[seleccionado.cia].nombre}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "rgba(148, 163, 184, 0.1)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>ESTADO</div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: ESTADOS[seleccionado.estado]?.color || "#64748b" }}>
                    {ESTADOS[seleccionado.estado]?.icon} {ESTADOS[seleccionado.estado]?.label || seleccionado.estado}
                  </div>
                </div>
                <div style={{ background: "rgba(148, 163, 184, 0.1)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>DÍAS</div>
                  <div style={{ fontSize: "16px", fontWeight: "600" }}>
                    {calcularDias(seleccionado.fecha)} días
                  </div>
                </div>
              </div>

              <a
                href={seleccionado.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  background: "linear-gradient(135deg, #4285f4 0%, #34a853 100%)",
                  color: "white",
                  padding: "16px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "15px",
                  transition: "transform 0.2s ease"
                }}
              >
                📁 Abrir en Google Drive
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: "center", 
        marginTop: "40px", 
        padding: "20px",
        color: "#64748b",
        fontSize: "12px"
      }}>
        Mostrando {siniestrosFiltrados.length} de {SINIESTROS_REALES.length} siniestros • 
        Última actualización: {new Date().toLocaleDateString('es-AR')}
      </div>
    </div>
  );
}
