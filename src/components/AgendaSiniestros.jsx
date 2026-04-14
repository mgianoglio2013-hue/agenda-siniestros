import { useState, useEffect, useCallback } from "react";

// ─── IDs REALES de Google Drive ───────────────────────────────────────────────
const DRIVE = {
  cias: {
    "Integrity Seguros": { id:"1GCNODjvlybIQrpS_Yo0VonUhK0ZXmYPg", color:"#5b21b6", bg:"#ede9fe" },
    "San Cristóbal":     { id:"1bP7w-E8mLev8Hk_iNteUj81ItZn1XrnE", color:"#0369a1", bg:"#e0f2fe" },
    "MAPFRE":            { id:"195un4KFUQCc8R0vW4q39cJPmVqpeEbdV",  color:"#b91c1c", bg:"#fee2e2" },
    "Provincia Seguros": { id:"1dwwXmf9HMc0sL7tHjBKnxomdv3zCUs6D",  color:"#166534", bg:"#dcfce7" },
    "Galeno":            { id:"19EKUH6T9L71WkEJGp9lvH6kQnwczja1Q",  color:"#92400e", bg:"#fef3c7" },
  },
};

const ETAPAS = [
  { id:"recepcion",     label:"Recepción",     icon:"📥", color:"#374151" },
  { id:"analisis",      label:"Análisis",      icon:"⚖️", color:"#5b21b6" },
  { id:"informe",       label:"Informe",       icon:"📋", color:"#1e40af" },
  { id:"oferta",        label:"Oferta",        icon:"💬", color:"#0369a1" },
  { id:"convenio",      label:"Convenio",      icon:"📝", color:"#166534" },
  { id:"documentacion", label:"Documentación", icon:"📂", color:"#92400e" },
  { id:"cierre",        label:"Cierre",        icon:"✅", color:"#14532d" },
];

const PRIO_C  = { alta:"#dc2626", media:"#d97706", baja:"#16a34a" };
const CIAS_LIST = Object.keys(DRIVE.cias);
const AGENTE_URL = "https://agente-siniestros-production.up.railway.app";

const G = {
  fondo:"#f5f7fa", fondoCard:"#ffffff", borde:"#d1d9e0",
  texto:"#111827", textoSec:"#374151", textoTer:"#6b7280",
  input:{ background:"#fff", border:"1px solid #d1d9e0", borderRadius:8, color:"#111827", fontSize:16, padding:"10px 14px", fontFamily:"inherit", width:"100%" },
};

// ─── Detectar etapa por nombre de carpeta ─────────────────────────────────────
function detectarEtapa(nombre) {
  const n = nombre.toUpperCase();
  if (n.includes("CERRAD") || n.includes("PAGAD")) return "cierre";
  if (n.includes("CONVEN")) return "convenio";
  if (n.includes("TERC") || n.includes("OFERT")) return "oferta";
  if (n.includes("INF") || n.includes("01F") || n.includes("02F") || n.includes("03F")) return "informe";
  return "recepcion";
}

// ─── Llamar al agente ─────────────────────────────────────────────────────────
async function llamarAgente(tarea, siniestro_id, cia, datos={}) {
  try {
    const res = await fetch(AGENTE_URL+"/ejecutar", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({siniestro_id, cia, tarea, datos})
    });
    return await res.json();
  } catch(e) { return {ok:false, mensaje:e.message}; }
}

// ─── Leer carpetas de Drive via Claude API ────────────────────────────────────
async function leerCarpetasCIA(ciaName, folderId) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body: JSON.stringify({
      model:"claude-sonnet-4-5", max_tokens:3000,
      system:"Sos un agente de Google Drive. Respondé SOLO con JSON válido sin explicaciones ni backticks.",
      mcp_servers:[{type:"url",url:"https://drivemcp.googleapis.com/mcp/v1",name:"gdrive"}],
      messages:[{role:"user",content:`Listá TODAS las subcarpetas dentro de la carpeta con ID "${folderId}". 
Excluí carpetas que empiecen con ZZ o ZZCONVENIOS.
Retorná SOLO este JSON (sin texto extra): [{"nombre":"...","id":"...","url":"..."}]
Si no hay subcarpetas retorná: []`}],
    }),
  });
  const data = await res.json();
  const texto = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
  const match = texto.match(/\[[\s\S]*?\]/);
  if(!match) return [];
  try {
    const carpetas = JSON.parse(match[0]);
    return carpetas.map(c=>({
      id: c.nombre || c.id,
      cia: ciaName,
      asegurado: c.nombre || "",
      tipo: "Choque",
      vehiculo: "",
      telefono: "",
      agente: "Gianoglio",
      prioridad: "media",
      fecha_ingreso: "",
      etapa: detectarEtapa(c.nombre || ""),
      folder_id: c.id,
      url_drive: c.url || `https://drive.google.com/drive/folders/${c.id}`,
      tareas: [],
      log: [],
    }));
  } catch { return []; }
}

export default function AgendaSiniestros() {
  const [siniestros,   setSiniestros]   = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [ciasCargando, setCiasCargando] = useState({});
  const [error,        setError]        = useState(null);
  const [filtro,       setFiltro]       = useState("todos");
  const [vista,        setVista]        = useState("agenda");
  const [seleccionado, setSeleccionado] = useState(null);
  const [guardando,    setGuardando]    = useState(false);
  const [notif,        setNotif]        = useState(null);
  const [formNuevo,    setFormNuevo]    = useState({
    cia:"Integrity Seguros", tipo:"Choque", asegurado:"", vehiculo:"",
    telefono:"", agente:"", prioridad:"media",
    fecha_ingreso:new Date().toLocaleDateString("es-AR"),
  });

  const showNotif = (msg, tipo="ok") => { setNotif({msg,tipo}); setTimeout(()=>setNotif(null),4000); };

  const cargar = useCallback(async()=>{
    setCargando(true); setError(null); setSiniestros([]);
    try {
      const todos = [];
      for(const [cia, info] of Object.entries(DRIVE.cias)) {
        setCiasCargando(p=>({...p,[cia]:true}));
        try {
          const stros = await leerCarpetasCIA(cia, info.id);
          todos.push(...stros);
          setSiniestros(prev=>[...prev,...stros]);
        } catch(e) { console.error(`Error cargando ${cia}:`, e); }
        setCiasCargando(p=>({...p,[cia]:false}));
      }
    } catch(e) { setError(e.message); }
    finally { setCargando(false); }
  },[]);

  useEffect(()=>{ cargar(); },[]);

  const filtrados = filtro==="todos" ? siniestros : siniestros.filter(s=>s.cia===filtro);
  const etapaDe   = s => ETAPAS.find(e=>e.id===s.etapa)||ETAPAS[0];
  const etapaIdx  = s => ETAPAS.findIndex(e=>e.id===s.etapa);
  const CI = name => DRIVE.cias[name]||{color:"#374151",bg:"#f3f4f6"};

  const cambiarEtapa = async(s, nuevaEtapa) => {
    const actualizado = {...s, etapa:nuevaEtapa.id};
    setSiniestros(prev=>prev.map(x=>x.folder_id===s.folder_id?actualizado:x));
    if(seleccionado?.folder_id===s.folder_id) setSeleccionado(actualizado);
    showNotif(`📊 ${s.id} → ${nuevaEtapa.label}`);
  };

  return (
    <div style={{fontFamily:"'Segoe UI',Arial,sans-serif",background:G.fondo,minHeight:"100vh",color:G.texto,fontSize:16}}>
      <style>{`
        *{box-sizing:border-box}
        .card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.12)!important}
        .btn:hover{filter:brightness(.93)}
        .fade{animation:fi .3s ease}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .spin{animation:sp 1s linear infinite;display:inline-block}
        @keyframes sp{to{transform:rotate(360deg)}}
        input:focus,select:focus{outline:3px solid #5b21b6!important}
      `}</style>

      {notif&&<div className="fade" style={{position:"fixed",top:18,right:18,zIndex:9999,background:notif.tipo==="ok"?"#166534":"#991b1b",color:"#fff",padding:"14px 22px",borderRadius:10,fontSize:16,fontWeight:"bold",boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>{notif.msg}</div>}

      {/* HEADER */}
      <div style={{background:"#1e293b",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {vista!=="agenda"&&<button onClick={()=>setVista("agenda")} style={{background:"#334155",border:"none",color:"#e2e8f0",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:15}}>← Volver</button>}
          <span style={{fontSize:22,fontWeight:"bold",color:"#f8fafc",letterSpacing:1}}>⚡ GIANOGLIO PERITACIONES</span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {Object.entries(ciasCargando).filter(([,v])=>v).map(([k])=>(
            <span key={k} style={{color:"#93c5fd",fontSize:13}}><span className="spin">⟳</span> {k}...</span>
          ))}
          <button className="btn" onClick={cargar} disabled={cargando} style={{padding:"8px 16px",background:"#334155",border:"none",color:"#e2e8f0",borderRadius:8,cursor:"pointer",fontSize:15}}>🔄 Actualizar</button>
          {vista==="agenda"&&<button className="btn" onClick={()=>setVista("nuevo")} style={{padding:"9px 20px",background:"#5b21b6",border:"none",color:"#fff",borderRadius:8,cursor:"pointer",fontSize:16,fontWeight:"bold"}}>+ Nuevo</button>}
        </div>
      </div>

      {/* AGENDA */}
      {vista==="agenda"&&(
        <div style={{padding:"20px 24px"}}>
          {/* Filtros */}
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            {["todos",...CIAS_LIST].map(c=>{
              const ci=CI(c); const activo=filtro===c;
              return <button key={c} onClick={()=>setFiltro(c)} style={{padding:"8px 18px",borderRadius:20,border:`2px solid ${activo?ci.color:"#d1d9e0"}`,cursor:"pointer",fontSize:15,fontWeight:"bold",background:activo?ci.bg:"#fff",color:activo?ci.color:G.textoSec,transition:"all .2s"}}>{c==="todos"?"📋 TODOS":c.toUpperCase()}</button>;
            })}
          </div>

          {/* Pipeline */}
          <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
            {ETAPAS.map(e=>{
              const n=filtrados.filter(s=>s.etapa===e.id).length;
              return <div key={e.id} style={{flex:"0 0 auto",textAlign:"center",padding:"10px 14px",background:"#fff",borderRadius:10,minWidth:110,border:`1px solid ${e.color}`,boxShadow:"0 2px 6px rgba(0,0,0,.06)"}}>
                <div style={{fontSize:20}}>{e.icon}</div>
                <div style={{fontSize:13,color:G.textoTer,fontWeight:"bold",marginTop:2}}>{e.label}</div>
                <div style={{fontSize:26,fontWeight:"bold",color:e.color}}>{n}</div>
              </div>;
            })}
          </div>

          {error&&<div style={{padding:"16px",background:"#fee2e2",border:"2px solid #dc2626",borderRadius:10,color:"#7f1d1d",fontSize:16,marginBottom:12}}>⚠ {error}</div>}

          {cargando&&siniestros.length===0&&(
            <div style={{textAlign:"center",padding:"50px",color:G.textoSec}}>
              <div style={{fontSize:40,marginBottom:12}}><span className="spin">⟳</span></div>
              <div style={{fontSize:17}}>Cargando siniestros desde Google Drive...</div>
              <div style={{fontSize:14,color:G.textoTer,marginTop:8}}>Esto puede tardar unos segundos</div>
            </div>
          )}

          {/* Lista siniestros */}
          <div style={{display:"grid",gap:10}}>
            {filtrados.length===0&&!cargando&&<div style={{textAlign:"center",padding:"50px",color:G.textoTer,fontSize:17}}><div style={{fontSize:40,marginBottom:12}}>📂</div>No hay siniestros.</div>}
            {filtrados.map(s=>{
              const ci=CI(s.cia); const et=etapaDe(s); const ei=etapaIdx(s);
              return <div key={s.folder_id} className="card" onClick={()=>{setSeleccionado(s);setVista("detalle")}} style={{background:"#fff",border:"1px solid "+G.borde,borderRadius:12,padding:"14px 18px",cursor:"pointer",transition:"all .2s",borderLeft:`5px solid ${et.color}`,display:"grid",gridTemplateColumns:"1fr 180px 180px auto",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                <div>
                  <div style={{display:"flex",gap:8,marginBottom:6}}>
                    <span style={{background:ci.bg,color:ci.color,fontSize:13,padding:"3px 10px",borderRadius:10,fontWeight:"bold"}}>{s.cia}</span>
                    <span style={{background:PRIO_C[s.prioridad]+"22",color:PRIO_C[s.prioridad],fontSize:13,padding:"3px 10px",borderRadius:10,fontWeight:"bold"}}>● {(s.prioridad||"media").toUpperCase()}</span>
                  </div>
                  <div style={{fontWeight:"bold",fontSize:18,color:G.texto}}>{s.id}</div>
                  <div style={{color:G.textoTer,fontSize:14,marginTop:2}}>{s.asegurado}</div>
                </div>
                <div>
                  <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:16,fontSize:15,fontWeight:"bold",background:et.color+"18",color:et.color,border:`1px solid ${et.color}`}}>{et.icon} {et.label}</span>
                  <div style={{display:"flex",gap:2,marginTop:8}}>{ETAPAS.map((e,i)=><div key={e.id} style={{flex:1,height:4,borderRadius:2,background:i<=ei?et.color:"#e5e7eb"}}/>)}</div>
                </div>
                <div>
                  <div style={{fontSize:13,color:G.textoTer,marginBottom:6,fontWeight:"bold"}}>CAMBIAR ETAPA</div>
                  <select onClick={e=>e.stopPropagation()} onChange={e=>{const et2=ETAPAS.find(x=>x.id===e.target.value);if(et2)cambiarEtapa(s,et2)}} value={s.etapa} style={{...G.input,fontSize:14,padding:"6px 10px"}}>
                    {ETAPAS.map(e=><option key={e.id} value={e.id}>{e.icon} {e.label}</option>)}
                  </select>
                </div>
                <div style={{textAlign:"right"}}>
                  {s.url_drive&&<a href={s.url_drive} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:14,color:"#166534",textDecoration:"none",fontWeight:"bold",display:"block",marginBottom:4}}>📁 Abrir</a>}
                  <div style={{fontSize:13,color:"#5b21b6",fontWeight:"bold"}}>{s.agente}</div>
                </div>
              </div>;
            })}
          </div>
        </div>
      )}

      {/* NUEVO SINIESTRO */}
      {vista==="nuevo"&&(
        <div className="fade" style={{padding:"28px",maxWidth:700,margin:"0 auto"}}>
          <div style={{fontSize:20,fontWeight:"bold",color:G.texto,marginBottom:20}}>📥 Nuevo Siniestro</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[
              {l:"COMPAÑÍA",k:"cia",t:"select",ops:CIAS_LIST},
              {l:"TIPO",k:"tipo",t:"select",ops:["Choque","Granizo","Robo Parcial","Robo Total","Incendio","Daño Parcial","Atropello","Otro"]},
              {l:"N° SINIESTRO *",k:"asegurado",t:"input"},{l:"VEHÍCULO",k:"vehiculo",t:"input"},
              {l:"TELÉFONO TERCERO",k:"telefono",t:"input"},{l:"ASEGURADO",k:"agente",t:"input"},
              {l:"PRIORIDAD",k:"prioridad",t:"select",ops:["alta","media","baja"]},
              {l:"FECHA",k:"fecha_ingreso",t:"input"},
            ].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:14,fontWeight:"bold",color:G.textoSec,marginBottom:6}}>{f.l}</div>
                {f.t==="select"
                  ?<select value={formNuevo[f.k]} onChange={e=>setFormNuevo(p=>({...p,[f.k]:e.target.value}))} style={{...G.input}}>{f.ops.map(o=><option key={o}>{o}</option>)}</select>
                  :<input value={formNuevo[f.k]} onChange={e=>setFormNuevo(p=>({...p,[f.k]:e.target.value}))} style={{...G.input}}/>
                }
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:12,marginTop:20}}>
            <button className="btn" onClick={()=>{showNotif("✅ Siniestro registrado en agenda");setVista("agenda");}} disabled={!formNuevo.asegurado.trim()} style={{flex:1,padding:"14px",background:formNuevo.asegurado.trim()?"#5b21b6":"#9ca3af",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:17,fontWeight:"bold"}}>
              ✅ REGISTRAR EN AGENDA
            </button>
            <button onClick={()=>setVista("agenda")} style={{padding:"14px 20px",background:"#fff",color:G.textoSec,border:`2px solid ${G.borde}`,borderRadius:10,cursor:"pointer",fontSize:16}}>Cancelar</button>
          </div>
        </div>
      )}

      {/* DETALLE */}
      {vista==="detalle"&&seleccionado&&(()=>{
        const s=seleccionado; const ci=CI(s.cia); const et=etapaDe(s); const ei=etapaIdx(s);
        return(
          <div className="fade" style={{padding:"20px 24px",display:"grid",gridTemplateColumns:"1fr 300px",gap:18}}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:"#fff",border:`1px solid ${G.borde}`,borderRadius:12,padding:"20px",borderLeft:`6px solid ${et.color}`,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{display:"flex",gap:8,marginBottom:8}}>
                      <span style={{background:ci.bg,color:ci.color,fontSize:14,padding:"4px 12px",borderRadius:10,fontWeight:"bold"}}>{s.cia}</span>
                    </div>
                    <div style={{fontSize:26,fontWeight:"bold",color:G.texto}}>{s.id}</div>
                    <div style={{color:G.textoSec,fontSize:16}}>{s.asegurado}</div>
                  </div>
                  <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:16,fontSize:15,fontWeight:"bold",background:et.color+"18",color:et.color,border:`2px solid ${et.color}`}}>{et.icon} {et.label}</span>
                </div>
                <div style={{display:"flex",gap:2,borderRadius:8,overflow:"hidden"}}>
                  {ETAPAS.map((e,i)=><div key={e.id} style={{flex:1,padding:"5px 2px",textAlign:"center",fontSize:12,background:i<ei?e.color+"33":i===ei?e.color:"#f3f4f6",color:i<=ei?i===ei?"#fff":e.color:"#9ca3af",fontWeight:i===ei?"bold":"normal",cursor:"pointer"}} onClick={()=>cambiarEtapa(s,e)}>{e.icon}</div>)}
                </div>
                <div style={{marginTop:10,fontSize:14,color:G.textoTer}}>Hacé clic en una etapa para avanzar</div>
              </div>

              {s.url_drive&&(
                <a href={s.url_drive} target="_blank" rel="noreferrer" style={{display:"block",padding:"16px 20px",background:"#dcfce7",border:"2px solid #166534",borderRadius:12,color:"#166534",textDecoration:"none",fontSize:17,fontWeight:"bold",textAlign:"center"}}>
                  📁 Abrir carpeta del siniestro en Drive →
                </a>
              )}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:"#fff",border:`1px solid ${G.borde}`,borderRadius:10,padding:"14px",boxShadow:"0 2px 6px rgba(0,0,0,.06)"}}>
                <div style={{fontSize:15,fontWeight:"bold",color:G.texto,marginBottom:10}}>⚡ ACCIONES</div>
                {[
                  {label:"🤖 Escanear Integrity",c:"#166534",bg:"#dcfce7",fn:()=>llamarAgente("escanear_nuevos","*","Integrity Seguros").then(r=>showNotif(r.mensaje||"Escaneando..."))},
                  {label:"⚖️ Generar Dictamen IA",c:"#5b21b6",bg:"#ede9fe",fn:null},
                  {label:"📲 WhatsApp tercero",c:"#0369a1",bg:"#e0f2fe",fn:null},
                  {label:"📄 Ver documentos",c:"#1e40af",bg:"#dbeafe",fn:()=>s.url_drive&&window.open(s.url_drive,"_blank")},
                ].map((a,i)=>(
                  <button key={i} className="btn" onClick={()=>a.fn&&a.fn()} style={{width:"100%",marginBottom:8,padding:"10px 14px",background:a.bg,color:a.c,border:`2px solid ${a.c}`,borderRadius:8,cursor:"pointer",fontSize:15,fontWeight:"bold",textAlign:"left"}}>
                    {a.label}
                  </button>
                ))}
              </div>

              <div style={{background:"#fff",border:`1px solid ${G.borde}`,borderRadius:10,padding:"14px",boxShadow:"0 2px 6px rgba(0,0,0,.06)"}}>
                <div style={{fontSize:15,fontWeight:"bold",color:G.texto,marginBottom:10}}>📊 CAMBIAR ETAPA</div>
                {ETAPAS.map(e=>(
                  <button key={e.id} className="btn" onClick={()=>cambiarEtapa(s,e)} style={{width:"100%",marginBottom:6,padding:"9px 12px",background:s.etapa===e.id?e.color+"22":"#f9fafb",color:s.etapa===e.id?e.color:G.textoSec,border:`2px solid ${s.etapa===e.id?e.color:"#e5e7eb"}`,borderRadius:8,cursor:"pointer",fontSize:15,fontWeight:s.etapa===e.id?"bold":"normal",textAlign:"left"}}>
                    {e.icon} {e.label} {s.etapa===e.id?"◀ actual":""}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
