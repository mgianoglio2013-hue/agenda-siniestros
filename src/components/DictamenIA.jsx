import { useState } from "react";

const buildSystemPrompt = (geoData) => `Sos un perito liquidador de siniestros viales especializado en la Ley Nacional de Tránsito N° 24.449 y sus modificatorias de la República Argentina.

${geoData ? `DATOS GEOGRÁFICOS VERIFICADOS DEL LUGAR (OpenStreetMap):
${JSON.stringify(geoData, null, 2)}
Usá estos datos como evidencia objetiva. Si hay semáforo, contrastalo con lo declarado. Si hay PARE, verificá si el conductor lo respetó. Si es rotonda, aplicar Art. 39 inc. f. Si la calzada es tierra/ripio, considerarlo en velocidad segura (Art. 40).
` : ''}

ARTÍCULOS CLAVE:
- Art. 39: Preferencia de paso — derecha tiene prioridad en cruces sin señal; en rotondas prioridad a quien está adentro
- Art. 40: Velocidad — debe permitir detenerse ante obstáculos; en tierra/ripio velocidad máxima reducida
- Art. 41: Semáforos — rojo = detención total
- Art. 43: Giro/cambio de carril — señalizar y ceder
- Art. 44: Distancia de seguridad — conductor trasero es responsable
- Art. 45: Adelantamiento — solo por izquierda con visibilidad
- Art. 48: Marcha atrás — solo cuando indispensable
- Art. 56: Atención plena del conductor
- Art. 57: Prioridad peatonal en cruces señalizados
- Art. 64: Infracciones graves

TIPOS DE RESULTADO: "CULPA EXCLUSIVA DEL ASEGURADO" | "CULPA EXCLUSIVA DEL TERCERO" | "CULPA CONCURRENTE" | "CASO FORTUITO / FUERZA MAYOR" | "PENDIENTE — DATOS INSUFICIENTES"

RESPONDÉ SOLO con JSON válido sin backticks ni texto extra:
{"resultado":"...","asegurado_pct":0,"tercero_pct":0,"articulos_aplicados":[{"numero":"Art. XX","descripcion":"...","aplicacion":"..."}],"fundamento":"...","analisis_geografico":"...","hechos_relevantes":["..."],"agravantes":["..."],"atenuantes":["..."],"recomendacion":"...","nivel_certeza":"ALTO","datos_faltantes":["..."]}`;

const TIPOS = ["Choque frontal","Choque por alcance (trasero)","Choque lateral","Choque en intersección","Cruce en semáforo","Giro indebido","Cambio de carril","Adelantamiento","Atropello peatonal","Marcha atrás","Rotonda","Pérdida de control","Otro"];
const NIVEL_C = { ALTO:"#16a34a", MEDIO:"#d97706", BAJO:"#dc2626" };
const RES_C = { "CULPA EXCLUSIVA DEL ASEGURADO":"#dc2626","CULPA EXCLUSIVA DEL TERCERO":"#16a34a","CULPA CONCURRENTE":"#d97706","CASO FORTUITO / FUERZA MAYOR":"#6366f1","PENDIENTE — DATOS INSUFICIENTES":"#64748b" };
const SURFACE = { asphalt:"Asfalto",concrete:"Hormigón",paving_stones:"Adoquines",gravel:"Ripio / Granza",dirt:"Tierra",unpaved:"Sin pavimento",compacted:"Compactado",sand:"Arena" };
const ROADS = { primary:"Ruta principal",secondary:"Secundaria",tertiary:"Terciaria",residential:"Residencial",trunk:"Ruta troncal",motorway:"Autopista",living_street:"Calle compartida",service:"Acceso/Servicio" };

async function geocode(addr) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`, { headers:{"Accept-Language":"es"} });
  const d = await r.json();
  if (!d.length) throw new Error("Dirección no encontrada");
  return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), display: d[0].display_name };
}

async function overpass(lat, lon) {
  const q = `[out:json][timeout:25];(node["highway"="traffic_signals"](around:80,${lat},${lon});node["highway"="stop"](around:80,${lat},${lon});node["highway"="give_way"](around:80,${lat},${lon});node["highway"="crossing"](around:80,${lat},${lon});way["junction"="roundabout"](around:80,${lat},${lon});way["highway"](around:40,${lat},${lon});way["oneway"="yes"](around:80,${lat},${lon});way["maxspeed"](around:80,${lat},${lon}););out body;>;out skel qt;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", { method:"POST", body:"data="+encodeURIComponent(q), headers:{"Content-Type":"application/x-www-form-urlencoded"} });
  const d = await r.json();
  return d.elements || [];
}

function parseFeatures(els) {
  const f = { semaforo:false,pare:false,ceda:false,rotonda:false,cruce_peatonal:false,mano_unica:false,superficie:null,tipo_via:null,vel_max:null,calles:[] };
  for (const e of els) {
    const t = e.tags||{};
    if (t.highway==="traffic_signals") f.semaforo=true;
    if (t.highway==="stop") f.pare=true;
    if (t.highway==="give_way") f.ceda=true;
    if (t.highway==="crossing") f.cruce_peatonal=true;
    if (t.junction==="roundabout") f.rotonda=true;
    if (t.oneway==="yes") f.mano_unica=true;
    if (t.surface&&!f.superficie) f.superficie=t.surface;
    if (t.highway&&ROADS[t.highway]&&!f.tipo_via) f.tipo_via=t.highway;
    if (t.maxspeed&&!f.vel_max) f.vel_max=t.maxspeed;
    if (t.name&&!f.calles.includes(t.name)) f.calles.push(t.name);
  }
  return f;
}

function MapaPanel({ lat, lon, display }) {
  const bbox = [lon-0.003,lat-0.002,lon+0.003,lat+0.002].join(",");
  return (
    <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid #1e3a5f" }}>
      <iframe
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
        width="100%" height="240" style={{ border:"none",display:"block" }} title="mapa" />
      <div style={{ background:"#0a0e1a", padding:"6px 12px", fontSize:10, color:"#475569", fontFamily:"monospace" }}>
        📍 {display?.split(",").slice(0,3).join(", ")} · {lat.toFixed(5)}, {lon.toFixed(5)}
      </div>
    </div>
  );
}

function GeoPanel({ f }) {
  const badges = [
    { k:"semaforo", icon:"🚦", label:"Semáforo", c:"#22c55e" },
    { k:"pare", icon:"🛑", label:"PARE", c:"#dc2626" },
    { k:"ceda", icon:"⚠️", label:"Ceda el Paso", c:"#f59e0b" },
    { k:"rotonda", icon:"🔄", label:"Rotonda", c:"#6366f1" },
    { k:"cruce_peatonal", icon:"🚶", label:"Cruce Peatonal", c:"#0891b2" },
    { k:"mano_unica", icon:"↗️", label:"Mano Única", c:"#7c3aed" },
  ];
  return (
    <div>
      <div style={{ fontFamily:"monospace", fontSize:10, color:"#7c3aed", letterSpacing:2, marginBottom:8 }}>SEÑALIZACIÓN DETECTADA — OSM</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
        {badges.map(b => (
          <span key={b.k} style={{
            padding:"5px 11px", borderRadius:16, fontSize:11, fontWeight:"bold",
            background: f[b.k] ? b.c+"33" : "#1e293b",
            color: f[b.k] ? b.c : "#334155",
            border:`1px solid ${f[b.k] ? b.c+"66" : "#1e293b"}`
          }}>{b.icon} {b.label} {f[b.k]?"✓":"—"}</span>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[
          { l:"TIPO VÍA", v: ROADS[f.tipo_via]||"No detectado" },
          { l:"SUPERFICIE", v: SURFACE[f.superficie]||f.superficie||"No detectada" },
          { l:"VEL. MÁX.", v: f.vel_max ? f.vel_max+" km/h" : "No señalizada" },
        ].map(d => (
          <div key={d.l} style={{ background:"#0a0e1a", borderRadius:7, padding:"9px 10px" }}>
            <div style={{ fontSize:9, color:"#475569", letterSpacing:1, marginBottom:3, fontFamily:"monospace" }}>{d.l}</div>
            <div style={{ fontSize:12, color:"#e2e8f0", fontWeight:"bold" }}>{d.v}</div>
          </div>
        ))}
      </div>
      {f.calles.length>0 && <div style={{ marginTop:7, fontSize:11, color:"#60a5fa", fontFamily:"monospace" }}>🛣️ {f.calles.join(" · ")}</div>}
      {/* Alertas automáticas */}
      {f.superficie && ["gravel","dirt","unpaved","sand"].includes(f.superficie) && (
        <div style={{ marginTop:8, padding:"7px 10px", background:"#1a0a00", border:"1px solid #d97706", borderRadius:7, fontSize:11, color:"#fbbf24" }}>⚠ Calzada no pavimentada — Art. 40: velocidad reducida obligatoria</div>
      )}
      {f.rotonda && <div style={{ marginTop:5, padding:"7px 10px", background:"#0a0a2a", border:"1px solid #6366f1", borderRadius:7, fontSize:11, color:"#a5b4fc" }}>🔄 Art. 39 inc. f: quien está dentro de la rotonda tiene prioridad</div>}
      {f.semaforo && <div style={{ marginTop:5, padding:"7px 10px", background:"#051a10", border:"1px solid #16a34a", borderRadius:7, fontSize:11, color:"#86efac" }}>🚦 Art. 41: declaraciones serán contrastadas con semáforo detectado</div>}
      {f.pare && <div style={{ marginTop:5, padding:"7px 10px", background:"#1a0505", border:"1px solid #dc2626", borderRadius:7, fontSize:11, color:"#fca5a5" }}>🛑 Art. 64: Cartel de PARE — detención obligatoria total</div>}
    </div>
  );
}

export default function DictamenIA() {
  const [form, setForm] = useState({ stro_id:"INT-2025-0412", cia:"Integrity Seguros", tipo:"Choque en intersección", direccion:"", dec_asegurado:"", dec_tercero:"", contexto:"" });
  const [geo, setGeo] = useState(null);
  const [features, setFeatures] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [dictamen, setDictamen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aprobado, setAprobado] = useState(false);
  const [step, setStep] = useState("form");

  const buscarUbicacion = async () => {
    if (!form.direccion.trim()) return;
    setGeoLoading(true); setGeoError(null); setGeo(null); setFeatures(null);
    try {
      const coords = await geocode(form.direccion);
      setGeo(coords);
      const els = await overpass(coords.lat, coords.lon);
      setFeatures(parseFeatures(els));
    } catch(e) { setGeoError(e.message); }
    finally { setGeoLoading(false); }
  };

  const generar = async () => {
    if (!form.dec_asegurado.trim()) return;
    setLoading(true); setError(null);
    const geoResumen = features ? {
      semaforo: features.semaforo, cartel_PARE: features.pare, ceda_el_paso: features.ceda,
      rotonda: features.rotonda, cruce_peatonal: features.cruce_peatonal, mano_unica: features.mano_unica,
      tipo_via: ROADS[features.tipo_via]||features.tipo_via,
      superficie: SURFACE[features.superficie]||features.superficie||"no detectada",
      velocidad_maxima: features.vel_max ? features.vel_max+" km/h" : "no señalizada",
      calles: features.calles, ubicacion: geo?.display,
    } : null;

    const msg = `SINIESTRO: ${form.stro_id} | CIA: ${form.cia} | TIPO: ${form.tipo}
UBICACIÓN: ${form.direccion||"No especificada"}
DECLARACIÓN ASEGURADO: "${form.dec_asegurado}"
DECLARACIÓN TERCERO: "${form.dec_tercero||"No disponible"}"
CONTEXTO: ${form.contexto||"Sin datos adicionales"}
DATOS GEOGRÁFICOS: ${geoResumen?JSON.stringify(geoResumen):"No verificado"}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1500, system:buildSystemPrompt(geoResumen), messages:[{role:"user",content:msg}] }),
      });
      const data = await res.json();
      const raw = data.content?.map(b=>b.text||"").join("").trim();
      if (!raw) throw new Error("Respuesta vacía de la API");
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("JSON no encontrado en respuesta");
      setDictamen(JSON.parse(match[0]));
      setStep("resultado");
    } catch(e) { setError(`Error: ${e.message}`); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily:"Georgia,serif", background:"#070b14", minHeight:"100vh", color:"#e2e8f0", padding:"24px" }}>
      <style>{`
        *{box-sizing:border-box}
        textarea,input,select{font-family:'Courier New',monospace!important}
        .fi:focus{outline:none;border-color:#7c3aed!important;box-shadow:0 0 0 3px #7c3aed33}
        .fade{animation:fi .45s ease}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .spin{animation:sp 1s linear infinite;display:inline-block}
        @keyframes sp{to{transform:rotate(360deg)}}
        .btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid #1e3a5f", paddingBottom:16, marginBottom:22, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:"bold", color:"#a78bfa", letterSpacing:1 }}>⚖️ Dictamen de Culpabilidad + 🗺️ Geo-Análisis</div>
          <div style={{ fontFamily:"monospace", fontSize:11, color:"#475569", marginTop:3 }}>Ley 24.449 · OpenStreetMap · Overpass API · Señalización verificada por coordenadas</div>
        </div>
        {step==="resultado" && (
          <button onClick={()=>{setStep("form");setDictamen(null);setAprobado(false)}} style={{ background:"none",border:"1px solid #334155",color:"#64748b",padding:"7px 14px",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"monospace" }}>← Nuevo análisis</button>
        )}
      </div>

      {/* FORMULARIO */}
      {step==="form" && (
        <div className="fade" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, maxWidth:1100, margin:"0 auto" }}>

          {/* IZQ */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{l:"N° SINIESTRO",k:"stro_id"},{l:"COMPAÑÍA",k:"cia"}].map(f=>(
                <div key={f.k}>
                  <div style={{ fontFamily:"monospace", fontSize:9, color:"#7c3aed", letterSpacing:2, marginBottom:4 }}>{f.l}</div>
                  <input className="fi" value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}
                    style={{ width:"100%", padding:"8px 10px", background:"#0d1225", border:"1px solid #1e3a5f", borderRadius:7, color:"#f1f5f9", fontSize:12, transition:"all .2s" }} />
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily:"monospace", fontSize:9, color:"#7c3aed", letterSpacing:2, marginBottom:4 }}>TIPO DE SINIESTRO</div>
              <select className="fi" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}
                style={{ width:"100%", padding:"8px 10px", background:"#0d1225", border:"1px solid #1e3a5f", borderRadius:7, color:"#f1f5f9", fontSize:12 }}>
                {TIPOS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            {[{l:"DECLARACIÓN DEL ASEGURADO *",k:"dec_asegurado",r:5,ph:"Cómo ocurrió, desde dónde venía, velocidad, qué señalización había, qué hizo el tercero..."},{l:"DECLARACIÓN DEL TERCERO (opcional)",k:"dec_tercero",r:4,ph:"Versión del tercero..."},{l:"CONTEXTO ADICIONAL",k:"contexto",r:3,ph:"Clima, testigos, fotos, estado del vehículo..."}].map(f=>(
              <div key={f.k}>
                <div style={{ fontFamily:"monospace", fontSize:9, color:"#7c3aed", letterSpacing:2, marginBottom:4 }}>{f.l}</div>
                <textarea className="fi" value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} rows={f.r}
                  style={{ width:"100%", padding:"10px", background:"#0d1225", border:"1px solid #1e3a5f", borderRadius:7, color:"#f1f5f9", fontSize:12, resize:"vertical", lineHeight:1.6, transition:"all .2s" }} />
              </div>
            ))}
          </div>

          {/* DER — Mapa */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background:"#0d1225", border:"1px solid #1e3a5f", borderRadius:10, padding:"14px" }}>
              <div style={{ fontFamily:"monospace", fontSize:9, color:"#0891b2", letterSpacing:2, marginBottom:8 }}>🗺️ UBICACIÓN DEL SINIESTRO</div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <input className="fi" value={form.direccion} onChange={e=>setForm(p=>({...p,direccion:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&buscarUbicacion()}
                  placeholder="Ej: Av. Colón esq. San Martín, Córdoba, Argentina"
                  style={{ flex:1, padding:"8px 10px", background:"#070b14", border:"1px solid #1e3a5f", borderRadius:7, color:"#f1f5f9", fontSize:12, transition:"all .2s" }} />
                <button className="btn" onClick={buscarUbicacion} disabled={geoLoading||!form.direccion.trim()}
                  style={{ padding:"8px 14px", background:form.direccion.trim()?"#0891b2":"#1e293b", color:form.direccion.trim()?"#fff":"#475569", border:"none", borderRadius:7, cursor:"pointer", fontSize:12, fontFamily:"monospace", whiteSpace:"nowrap", transition:"all .2s" }}>
                  {geoLoading?<span className="spin">⟳</span>:"🔍 Buscar"}
                </button>
              </div>
              {geoError && <div style={{ color:"#fca5a5", fontSize:11, fontFamily:"monospace", marginBottom:8 }}>⚠ {geoError}</div>}
              {geo
                ? <MapaPanel lat={geo.lat} lon={geo.lon} display={geo.display} />
                : <div style={{ height:180, background:"#070b14", borderRadius:9, border:"1px dashed #1e3a5f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <div style={{ fontSize:28 }}>🗺️</div>
                    <div style={{ fontFamily:"monospace", fontSize:11, color:"#334155", textAlign:"center" }}>Ingresá la dirección para<br/>verificar señalización real</div>
                  </div>
              }
            </div>

            {features && (
              <div className="fade" style={{ background:"#0d1225", border:"1px solid #1e3a5f", borderRadius:10, padding:"14px" }}>
                <GeoPanel f={features} />
              </div>
            )}

            {!features && (
              <div style={{ padding:"12px 14px", background:"#0a0e1a", border:"1px dashed #334155", borderRadius:9, fontSize:11, color:"#475569", fontFamily:"monospace" }}>
                💡 Sin mapa: dictamen se basa solo en declaraciones.<br/>Con ubicación verificada la IA contrasta señalización real vs declarada.
              </div>
            )}
          </div>

          {/* BOTÓN FULL WIDTH */}
          <div style={{ gridColumn:"1 / -1" }}>
            <button className="btn" onClick={generar} disabled={!form.dec_asegurado.trim()||loading}
              style={{
                width:"100%", padding:"14px", borderRadius:10, border:"none", cursor:"pointer",
                background: !form.dec_asegurado.trim() ? "#1e293b" : features ? "linear-gradient(135deg,#7c3aed,#0891b2)" : "#7c3aed",
                color: form.dec_asegurado.trim()?"#fff":"#475569",
                fontFamily:"monospace", fontSize:14, fontWeight:500, letterSpacing:1, transition:"all .3s",
                boxShadow: features?"0 4px 24px #0891b244":"none"
              }}>
              {loading?"🔍 ANALIZANDO...": features?"⚖️ GENERAR DICTAMEN CON GEO-VERIFICACIÓN":"⚖️ GENERAR DICTAMEN DE CULPABILIDAD"}
            </button>
            {loading && <div style={{ textAlign:"center", marginTop:8, color:"#7c3aed", fontFamily:"monospace", fontSize:11, animation:"fi 1s ease infinite alternate" }}>
              Contrastando declaraciones con señalización real · Aplicando Ley 24.449...
            </div>}
            {error && <div style={{ marginTop:10, padding:"10px 14px", background:"#1a0505", border:"1px solid #dc2626", borderRadius:8, color:"#fca5a5", fontSize:12, fontFamily:"monospace" }}>⚠ {error}</div>}
          </div>
        </div>
      )}

      {/* RESULTADO */}
      {step==="resultado" && dictamen && (() => {
        const rc = RES_C[dictamen.resultado]||"#7c3aed";
        return (
          <div className="fade" style={{ maxWidth:880, margin:"0 auto" }}>
            {/* Header resultado */}
            <div style={{ background:"#0d1225", border:`2px solid ${rc}`, borderRadius:13, padding:"20px 24px", marginBottom:16, boxShadow:`0 0 40px ${rc}22` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:"monospace", fontSize:10, color:"#64748b", letterSpacing:2, marginBottom:5 }}>
                    {form.stro_id} · {form.cia} · {form.tipo}{geo&&<span style={{ color:"#0891b2" }}> · 📍 {form.direccion}</span>}
                  </div>
                  <div style={{ fontSize:22, fontWeight:"bold", color:rc }}>{dictamen.resultado}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"monospace", fontSize:9, color:"#64748b", marginBottom:4 }}>CERTEZA</div>
                  <span style={{ background:(NIVEL_C[dictamen.nivel_certeza]||"#64748b")+"22", color:NIVEL_C[dictamen.nivel_certeza]||"#64748b", padding:"4px 12px", borderRadius:20, fontSize:12, fontFamily:"monospace", fontWeight:"bold" }}>● {dictamen.nivel_certeza}</span>
                  {geo&&<div style={{ marginTop:5, fontSize:10, color:"#0891b2", fontFamily:"monospace" }}>🗺️ Geo-verificado</div>}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[{l:"ASEGURADO",p:dictamen.asegurado_pct,c:"#dc2626"},{l:"TERCERO",p:dictamen.tercero_pct,c:"#16a34a"}].map(b=>(
                  <div key={b.l}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontFamily:"monospace", fontSize:11 }}>
                      <span style={{ color:"#94a3b8" }}>{b.l}</span>
                      <span style={{ color:b.c, fontWeight:"bold", fontSize:20 }}>{b.p}%</span>
                    </div>
                    <div style={{ background:"#1e293b", borderRadius:8, height:10, overflow:"hidden" }}>
                      <div style={{ width:`${b.p}%`, height:"100%", background:b.c, transition:"width 1s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Análisis geográfico */}
            {dictamen.analisis_geografico && (
              <div style={{ background:"#00111a", border:"2px solid #0891b2", borderRadius:11, padding:"14px 18px", marginBottom:14, display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:22, flexShrink:0 }}>🗺️</span>
                <div>
                  <div style={{ fontFamily:"monospace", fontSize:9, color:"#0891b2", letterSpacing:2, marginBottom:5 }}>IMPACTO DE DATOS GEOGRÁFICOS EN EL DICTAMEN</div>
                  <div style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.7 }}>{dictamen.analisis_geografico}</div>
                </div>
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div style={{ background:"#0d1225", border:"1px solid #1e3a5f", borderRadius:11, padding:"16px" }}>
                <div style={{ fontFamily:"monospace", fontSize:9, color:"#7c3aed", letterSpacing:2, marginBottom:10 }}>ARTÍCULOS LEY 24.449</div>
                {(dictamen.articulos_aplicados||[]).map((a,i)=>(
                  <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:"1px solid #1e293b" }}>
                    <div style={{ fontFamily:"monospace", fontWeight:"bold", color:"#a78bfa", fontSize:12, marginBottom:3 }}>{a.numero}</div>
                    <div style={{ fontSize:12, color:"#94a3b8", marginBottom:2 }}>{a.descripcion}</div>
                    <div style={{ fontSize:12, color:"#60a5fa", fontStyle:"italic" }}>→ {a.aplicacion}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ background:"#0d1225", border:"1px solid #1e3a5f", borderRadius:11, padding:"14px", flex:1 }}>
                  <div style={{ fontFamily:"monospace", fontSize:9, color:"#0891b2", letterSpacing:2, marginBottom:8 }}>HECHOS RELEVANTES</div>
                  {(dictamen.hechos_relevantes||[]).map((h,i)=><div key={i} style={{ fontSize:12, color:"#cbd5e1", marginBottom:5, paddingLeft:8, borderLeft:"2px solid #0891b2" }}>{h}</div>)}
                </div>
                {dictamen.agravantes?.length>0&&<div style={{ background:"#1a0505", border:"1px solid #dc2626", borderRadius:11, padding:"12px" }}>
                  <div style={{ fontFamily:"monospace", fontSize:9, color:"#dc2626", letterSpacing:2, marginBottom:6 }}>AGRAVANTES</div>
                  {dictamen.agravantes.map((a,i)=><div key={i} style={{ fontSize:12, color:"#fca5a5", marginBottom:3 }}>⚠ {a}</div>)}
                </div>}
                {dictamen.atenuantes?.length>0&&<div style={{ background:"#051a10", border:"1px solid #16a34a", borderRadius:11, padding:"12px" }}>
                  <div style={{ fontFamily:"monospace", fontSize:9, color:"#16a34a", letterSpacing:2, marginBottom:6 }}>ATENUANTES</div>
                  {dictamen.atenuantes.map((a,i)=><div key={i} style={{ fontSize:12, color:"#86efac", marginBottom:3 }}>✓ {a}</div>)}
                </div>}
              </div>
            </div>

            <div style={{ background:"#0d1225", border:"1px solid #1e3a5f", borderRadius:11, padding:"16px", marginBottom:14 }}>
              <div style={{ fontFamily:"monospace", fontSize:9, color:"#7c3aed", letterSpacing:2, marginBottom:8 }}>FUNDAMENTO JURÍDICO</div>
              <div style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.8 }}>{dictamen.fundamento}</div>
            </div>

            <div style={{ background:"#0a1628", border:"2px solid #0891b2", borderRadius:11, padding:"13px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:22 }}>💡</span>
              <div>
                <div style={{ fontFamily:"monospace", fontSize:9, color:"#0891b2", letterSpacing:2, marginBottom:3 }}>RECOMENDACIÓN</div>
                <div style={{ fontSize:13, color:"#e2e8f0" }}>{dictamen.recomendacion}</div>
              </div>
            </div>

            {dictamen.datos_faltantes?.length>0&&<div style={{ background:"#1a1000", border:"1px solid #d97706", borderRadius:11, padding:"11px 16px", marginBottom:14 }}>
              <div style={{ fontFamily:"monospace", fontSize:9, color:"#d97706", letterSpacing:2, marginBottom:6 }}>⚠ DATOS FALTANTES</div>
              {dictamen.datos_faltantes.map((d,i)=><div key={i} style={{ fontSize:12, color:"#fbbf24", marginBottom:3 }}>→ {d}</div>)}
            </div>}

            {!aprobado
              ? <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  <button className="btn" onClick={()=>setAprobado(true)} style={{ padding:"12px", background:"#16a34a", color:"#fff", border:"none", borderRadius:10, fontFamily:"monospace", fontSize:13, cursor:"pointer", transition:"all .2s" }}>✅ APROBAR</button>
                  <button onClick={()=>{setStep("form");setDictamen(null)}} style={{ padding:"12px", background:"#1e293b", color:"#94a3b8", border:"1px solid #334155", borderRadius:10, fontFamily:"monospace", fontSize:13, cursor:"pointer" }}>✏️ MODIFICAR</button>
                  <button style={{ padding:"12px", background:"#1a0505", color:"#fca5a5", border:"1px solid #dc2626", borderRadius:10, fontFamily:"monospace", fontSize:13, cursor:"pointer" }}>❌ RECHAZAR</button>
                </div>
              : <div className="fade" style={{ background:"#051a10", border:"2px solid #16a34a", borderRadius:11, padding:"18px", textAlign:"center", boxShadow:"0 0 30px #16a34a33" }}>
                  <div style={{ fontSize:28, marginBottom:5 }}>✅</div>
                  <div style={{ fontSize:18, fontWeight:"bold", color:"#86efac", marginBottom:4 }}>Dictamen aprobado</div>
                  <div style={{ fontFamily:"monospace", fontSize:11, color:"#64748b", marginBottom:12 }}>Registrado · Listo para informe y oferta económica</div>
                  <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                    <button style={{ padding:"9px 18px", background:"#0891b2", color:"#fff", border:"none", borderRadius:8, fontFamily:"monospace", fontSize:12, cursor:"pointer" }}>📄 GENERAR INFORME</button>
                    <button style={{ padding:"9px 18px", background:"#1e293b", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:8, fontFamily:"monospace", fontSize:12, cursor:"pointer" }}>💬 IR A OFERTA</button>
                  </div>
                </div>
            }
          </div>
        );
      })()}
    </div>
  );
}
