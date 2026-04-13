import { useState, useEffect, useCallback } from "react";

// ─── IDs de Google Drive (generados al crear la estructura) ──────────────────
const DRIVE = {
  raiz:     "1UmFDRXhYp_un7eacG82kpzv8ItAcSy7-",
  indice:   "1y4zbvVW2EiaBnbc0KpPaKQrmtZyOpxoX",
  cias: {
    "Integrity Seguros": { id:"12aHCwv9EGAwmdylQWsRohRvByIUVISF-", color:"#7c3aed" },
    "Rus Seguros":       { id:"1YtWQP77GKvfTkGgx5iNjm_r0OwqMyndy", color:"#1d4ed8" },
    "Sancor Seguros":    { id:"1gAGwkrjMcgMFC9be7qVT9cCB3rW5bc-E", color:"#059669" },
    "_ARCHIVADOS":       { id:"1ANofF7ud0P9fqVWi-ccS_nnCuitUtOSV", color:"#475569" },
  },
  url_raiz: "https://drive.google.com/drive/folders/1UmFDRXhYp_un7eacG82kpzv8ItAcSy7-",
};

const ETAPAS = [
  { id:"recepcion",      label:"Recepción",      icon:"📥", color:"#64748b" },
  { id:"analisis",       label:"Análisis",        icon:"⚖️", color:"#7c3aed" },
  { id:"informe",        label:"Informe",         icon:"📋", color:"#1d4ed8" },
  { id:"oferta",         label:"Oferta",          icon:"💬", color:"#0891b2" },
  { id:"convenio",       label:"Convenio",        icon:"📝", color:"#059669" },
  { id:"documentacion",  label:"Documentación",   icon:"📂", color:"#d97706" },
  { id:"cierre",         label:"Cierre",          icon:"✅", color:"#16a34a" },
];

const PRIO_C = { alta:"#ef4444", media:"#f59e0b", baja:"#22c55e" };
const CIAS_LIST = ["Integrity Seguros","Rus Seguros","Sancor Seguros"];

// ─── Llamada al API de Claude con Google Drive MCP ───────────────────────────
async function callDriveAgent(instruction, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: systemPrompt || `Sos un agente que gestiona archivos en Google Drive para un sistema de siniestros.
Ejecutá la tarea usando las herramientas de Drive disponibles y respondé SOLO con el JSON solicitado. Sin texto extra, sin backticks, sin explicaciones.`,
      mcp_servers: [{ type:"url", url:"https://drivemcp.googleapis.com/mcp/v1", name:"gdrive" }],
      messages: [{ role:"user", content: instruction }],
    }),
  });
  const data = await res.json();
  const texto = (data.content || []).filter(b => b.type==="text").map(b=>b.text).join("");
  return texto;
}

async function leerSiniestros() {
  const ids = Object.values(DRIVE.cias).slice(0,3).map(c=>c.id).join(", ");
  const texto = await callDriveAgent(
    `Buscá todos los archivos llamados "datos.json" que estén dentro de subcarpetas de estas carpetas (IDs): ${ids}.
Para cada uno leé su contenido y extraé los campos: id, cia, asegurado, tipo, etapa, prioridad, agente, fecha_ingreso, vehiculo, folder_id, url_drive, tareas, log.
Retorná ÚNICAMENTE un array JSON (sin texto adicional): [{"id":"...","cia":"...",...},...]
Si no hay archivos, retorná: []`
  );
  const match = texto.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try { return JSON.parse(match[0]); } catch { return []; }
}

async function crearSiniestroEnDrive(datos) {
  const ciaInfo = DRIVE.cias[datos.cia];
  const nombreCarpeta = `${datos.id} — ${datos.asegurado} — ${datos.tipo}`;
  const contenido = JSON.stringify({ ...datos, log:[{fecha:new Date().toLocaleDateString("es-AR"),accion:"Siniestro creado.",tipo:"sistema"}], dictamen:null, oferta:null, convenio:null, documentacion:[], ultimo_actualizado:new Date().toISOString() });
  const texto = await callDriveAgent(
    `Realizá estas acciones en Google Drive en orden:
1. Creá una carpeta llamada exactamente "${nombreCarpeta}" dentro de la carpeta con ID "${ciaInfo.id}"
2. Dentro de esa nueva carpeta, creá un archivo llamado "datos.json" con este contenido exacto (es JSON, guardalo como application/json): ${contenido}
3. Creá una subcarpeta llamada "documentos" dentro de la nueva carpeta.
Cuando termines, retorná SOLO este JSON (sin texto extra):
{"folder_id":"ID_CARPETA_PRINCIPAL","url_drive":"URL_CARPETA_PRINCIPAL","datos_id":"ID_DATOS_JSON"}`
  );
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No se obtuvo respuesta de Drive");
  return JSON.parse(match[0]);
}

async function actualizarDatosJson(folderDriveId, nuevosDatos) {
  const json = JSON.stringify({ ...nuevosDatos, ultimo_actualizado:new Date().toISOString() });
  const texto = await callDriveAgent(
    `Buscá el archivo "datos.json" dentro de la carpeta con ID "${folderDriveId}".
Reemplazá TODO su contenido con este JSON exacto: ${json}
Retorná SOLO: {"ok":true}`
  );
  return texto.includes("true");
}

export default function AgendaDrive() {
  const [siniestros, setSiniestros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [vista, setVista] = useState("agenda");
  const [seleccionado, setSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [notif, setNotif] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [formNuevo, setFormNuevo] = useState({
    cia:"Integrity Seguros", tipo:"Choque", asegurado:"", vehiculo:"",
    telefono:"", agente:"", prioridad:"media",
    fecha_ingreso:new Date().toLocaleDateString("es-AR"),
  });

  const showNotif = (msg, tipo="ok") => { setNotif({msg,tipo}); setTimeout(()=>setNotif(null),3500); };

  const cargarSiniestros = useCallback(async () => {
    setCargando(true); setError(null);
    try { setSiniestros(await leerSiniestros()); }
    catch(e) { setError(e.message); }
    finally { setCargando(false); }
  }, []);

  useEffect(()=>{ cargarSiniestros(); }, []);

  const generarId = (cia) => {
    const p = {"Integrity Seguros":"INT","Rus Seguros":"RUS","Sancor Seguros":"SAN"}[cia]||"STR";
    return `${p}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
  };

  const crearNuevo = async () => {
    if (!formNuevo.asegurado.trim()) return;
    setGuardando(true);
    try {
      const id = generarId(formNuevo.cia);
      const datos = { id, ...formNuevo, etapa:"recepcion", tareas:["Solicitar documentación inicial"] };
      const result = await crearSiniestroEnDrive(datos);
      const nuevo = { ...datos, folder_id:result.folder_id, url_drive:result.url_drive, log:[{fecha:new Date().toLocaleDateString("es-AR"),accion:"Siniestro creado.",tipo:"sistema"}] };
      setSiniestros(prev=>[nuevo,...prev]);
      setVista("agenda");
      showNotif(`✅ ${id} creado y guardado en Drive`);
    } catch(e) { showNotif("❌ "+e.message,"error"); }
    finally { setGuardando(false); }
  };

  const avanzarEtapa = async () => {
    const s = seleccionado;
    const idx = ETAPAS.findIndex(e=>e.id===s.etapa);
    if (idx>=ETAPAS.length-1) return;
    const nuevaEtapa = ETAPAS[idx+1];
    const actualizado = { ...s, etapa:nuevaEtapa.id, log:[...(s.log||[]),{fecha:new Date().toLocaleDateString("es-AR"),accion:`→ Etapa: ${nuevaEtapa.label}`,tipo:"usuario"}] };
    setGuardando(true);
    try {
      await actualizarDatosJson(s.folder_id, actualizado);
      setSiniestros(prev=>prev.map(x=>x.id===s.id?actualizado:x));
      setSeleccionado(actualizado);
      showNotif(`📊 Avanzado a ${nuevaEtapa.label} · Guardado en Drive ☁️`);
    } catch(e) { showNotif("❌ "+e.message,"error"); }
    finally { setGuardando(false); }
  };

  const agregarTarea = async () => {
    if (!nuevaTarea.trim()||!seleccionado) return;
    const actualizado = { ...seleccionado, tareas:[...(seleccionado.tareas||[]),nuevaTarea] };
    setGuardando(true);
    try {
      await actualizarDatosJson(seleccionado.folder_id, actualizado);
      setSiniestros(prev=>prev.map(x=>x.id===seleccionado.id?actualizado:x));
      setSeleccionado(actualizado);
      setNuevaTarea("");
      showNotif("📌 Tarea guardada en Drive");
    } catch(e) { showNotif("❌ "+e.message,"error"); }
    finally { setGuardando(false); }
  };

  const filtrados = filtro==="todos" ? siniestros : siniestros.filter(s=>s.cia===filtro);
  const etapaDe = (s) => ETAPAS.find(e=>e.id===s.etapa)||ETAPAS[0];
  const etapaIdx = (s) => ETAPAS.findIndex(e=>e.id===s.etapa);

  return (
    <div style={{fontFamily:"'Courier New',monospace",background:"#070b14",minHeight:"100vh",color:"#e2e8f0"}}>
      <style>{`*{box-sizing:border-box}.card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.5)!important}.btn:hover{filter:brightness(1.12);transform:translateY(-1px)}.fade{animation:fi .4s ease}@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.spin{animation:sp 1s linear infinite;display:inline-block}@keyframes sp{to{transform:rotate(360deg)}}.field:focus{outline:none;border-color:#7c3aed!important;box-shadow:0 0 0 2px #7c3aed33}textarea,input,select{font-family:'Courier New',monospace!important}`}</style>

      {notif&&<div className="fade" style={{position:"fixed",top:18,right:18,zIndex:9999,background:notif.tipo==="ok"?"#16a34a":"#dc2626",color:"#fff",padding:"11px 20px",borderRadius:9,fontSize:13,fontWeight:"bold",boxShadow:"0 4px 20px rgba(0,0,0,.5)"}}>{notif.msg}</div>}

      {/* HEADER */}
      <div style={{background:"#0d1225",borderBottom:"2px solid #1e3a5f",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {vista!=="agenda"&&<button onClick={()=>setVista("agenda")} style={{background:"none",border:"1px solid #334155",color:"#64748b",padding:"5px 11px",borderRadius:6,cursor:"pointer",fontSize:11}}>← Volver</button>}
          <span style={{fontSize:19,fontWeight:"bold",color:"#60a5fa",letterSpacing:1.5}}>⚡ AGENDA SINIESTROS</span>
          <span style={{fontSize:11,color:"#475569"}}>☁️ Google Drive</span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {guardando&&<span style={{fontSize:12,color:"#7c3aed"}}><span className="spin">⟳</span> Guardando...</span>}
          <button className="btn" onClick={cargarSiniestros} style={{padding:"6px 12px",background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:7,cursor:"pointer",fontSize:11,transition:"all .2s"}}>🔄 Actualizar</button>
          <a href={DRIVE.url_raiz} target="_blank" rel="noreferrer" style={{padding:"6px 12px",background:"#1e293b",border:"1px solid #334155",color:"#60a5fa",borderRadius:7,fontSize:11,textDecoration:"none"}}>📁 Abrir Drive</a>
          {vista==="agenda"&&<button className="btn" onClick={()=>setVista("nuevo")} style={{padding:"7px 16px",background:"#3b82f6",border:"none",color:"#fff",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:"bold",transition:"all .2s"}}>+ Nuevo Siniestro</button>}
        </div>
      </div>

      {/* AGENDA */}
      {vista==="agenda"&&(
        <div style={{padding:"20px 24px"}}>
          <div style={{display:"flex",gap:7,marginBottom:18,flexWrap:"wrap"}}>
            {["todos",...CIAS_LIST].map(c=>(
              <button key={c} onClick={()=>setFiltro(c)} style={{padding:"5px 14px",borderRadius:16,border:"none",cursor:"pointer",fontSize:11,fontWeight:"bold",background:filtro===c?"#3b82f6":"#1e293b",color:filtro===c?"#fff":"#64748b",transition:"all .2s"}}>{c==="todos"?"📋 TODOS":c.toUpperCase()}</button>
            ))}
          </div>

          <div style={{display:"flex",gap:5,marginBottom:18,overflowX:"auto",paddingBottom:6}}>
            {ETAPAS.map(e=>{const n=siniestros.filter(s=>s.etapa===e.id).length;return(
              <div key={e.id} style={{flex:"0 0 auto",textAlign:"center",padding:"8px 12px",background:"#0d1225",borderRadius:8,minWidth:90,borderTop:`3px solid ${e.color}`}}>
                <div style={{fontSize:16}}>{e.icon}</div>
                <div style={{fontSize:9,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>{e.label}</div>
                <div style={{fontSize:20,fontWeight:"bold",color:e.color}}>{n}</div>
              </div>
            );})}
          </div>

          {cargando&&<div style={{textAlign:"center",padding:"48px",color:"#7c3aed"}}><div style={{fontSize:36,marginBottom:12}}><span className="spin">⟳</span></div><div style={{fontFamily:"monospace",fontSize:13}}>Leyendo desde Google Drive...</div></div>}
          {error&&<div style={{padding:"16px",background:"#1a0505",border:"1px solid #dc2626",borderRadius:10,color:"#fca5a5",fontSize:13}}> ⚠ {error} <button onClick={cargarSiniestros} style={{marginLeft:12,padding:"4px 10px",background:"#dc2626",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>Reintentar</button></div>}

          {!cargando&&!error&&(
            <div style={{display:"grid",gap:10}}>
              {filtrados.length===0&&<div style={{textAlign:"center",padding:"48px",color:"#334155",fontFamily:"monospace"}}><div style={{fontSize:36,marginBottom:10}}>📂</div>No hay siniestros. Creá el primero.</div>}
              {filtrados.map(s=>{
                const ci=DRIVE.cias[s.cia]; const et=etapaDe(s); const ei=etapaIdx(s);
                return(
                  <div key={s.id} className="card" onClick={()=>{setSeleccionado(s);setVista("detalle")}} style={{background:"#0d1225",border:"1px solid #1e3a5f",borderRadius:11,padding:"14px 18px",cursor:"pointer",transition:"all .2s",borderLeft:`4px solid ${et.color}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",alignItems:"center",gap:14}}>
                    <div>
                      <div style={{display:"flex",gap:7,marginBottom:4}}>
                        <span style={{background:(ci?.color||"#64748b")+"33",color:ci?.color||"#64748b",fontSize:9,padding:"2px 8px",borderRadius:9,fontWeight:"bold"}}>{s.cia}</span>
                        <span style={{background:PRIO_C[s.prioridad]+"33",color:PRIO_C[s.prioridad]||"#64748b",fontSize:9,padding:"2px 8px",borderRadius:9,fontWeight:"bold"}}>● {(s.prioridad||"media").toUpperCase()}</span>
                      </div>
                      <div style={{fontWeight:"bold",fontSize:14,color:"#f1f5f9"}}>{s.id}</div>
                      <div style={{color:"#94a3b8",fontSize:12}}>{s.asegurado} — {s.tipo}</div>
                      <div style={{color:"#475569",fontSize:11}}>{s.vehiculo}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>ETAPA</div>
                      <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:16,fontSize:11,fontWeight:"bold",background:et.color+"33",color:et.color}}>{et.icon} {et.label}</span>
                      <div style={{display:"flex",gap:2,marginTop:6}}>{ETAPAS.map((e,i)=><div key={e.id} style={{flex:1,height:3,borderRadius:2,background:i<=ei?et.color:"#1e293b"}}/>)}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>TAREAS</div>
                      {(s.tareas||[]).slice(0,2).map((t,i)=><div key={i} style={{fontSize:11,color:"#cbd5e1",marginBottom:2}}>→ {t}</div>)}
                      {(s.tareas||[]).length>2&&<div style={{fontSize:10,color:"#475569"}}>+{s.tareas.length-2} más</div>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:"#64748b"}}>{s.fecha_ingreso}</div>
                      <div style={{fontSize:11,color:"#60a5fa",marginTop:3}}>{s.agente}</div>
                      {s.url_drive&&<a href={s.url_drive} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:10,color:"#16a34a",textDecoration:"none"}}>📁 Drive</a>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* NUEVO */}
      {vista==="nuevo"&&(
        <div className="fade" style={{padding:"24px",maxWidth:680,margin:"0 auto"}}>
          <div style={{fontSize:18,fontWeight:"bold",color:"#a78bfa",marginBottom:20}}>📥 Nuevo Siniestro → se creará en Google Drive</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[
              {l:"COMPAÑÍA",k:"cia",t:"select",ops:CIAS_LIST},
              {l:"TIPO",k:"tipo",t:"select",ops:["Choque","Granizo","Robo Parcial","Robo Total","Incendio","Daño Parcial","Atropello","Otro"]},
              {l:"ASEGURADO",k:"asegurado",t:"input"},{l:"VEHÍCULO",k:"vehiculo",t:"input"},
              {l:"TELÉFONO",k:"telefono",t:"input"},{l:"AGENTE",k:"agente",t:"input"},
              {l:"PRIORIDAD",k:"prioridad",t:"select",ops:["alta","media","baja"]},
              {l:"FECHA INGRESO",k:"fecha_ingreso",t:"input"},
            ].map(f=>(
              <div key={f.k}>
                <div style={{fontFamily:"monospace",fontSize:9,color:"#7c3aed",letterSpacing:2,marginBottom:5}}>{f.l}</div>
                {f.t==="select"
                  ?<select className="field" value={formNuevo[f.k]} onChange={e=>setFormNuevo(p=>({...p,[f.k]:e.target.value}))} style={{width:"100%",padding:"9px 10px",background:"#0d1225",border:"1px solid #1e3a5f",borderRadius:7,color:"#f1f5f9",fontSize:12,transition:"all .2s"}}>{f.ops.map(o=><option key={o}>{o}</option>)}</select>
                  :<input className="field" value={formNuevo[f.k]} onChange={e=>setFormNuevo(p=>({...p,[f.k]:e.target.value}))} style={{width:"100%",padding:"9px 10px",background:"#0d1225",border:"1px solid #1e3a5f",borderRadius:7,color:"#f1f5f9",fontSize:12,transition:"all .2s"}}/>
                }
              </div>
            ))}
          </div>
          <div style={{margin:"14px 0",padding:"10px 14px",background:"#0a0e1a",border:"1px solid #334155",borderRadius:8,fontFamily:"monospace",fontSize:12,color:"#60a5fa"}}>
            📁 Se creará: Drive / AGENDA SINIESTROS / {formNuevo.cia} / {generarId(formNuevo.cia)} — {formNuevo.asegurado||"[asegurado]"} — {formNuevo.tipo}/
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn" onClick={crearNuevo} disabled={!formNuevo.asegurado.trim()||guardando} style={{flex:1,padding:"13px",background:formNuevo.asegurado.trim()?"#3b82f6":"#1e293b",color:formNuevo.asegurado.trim()?"#fff":"#475569",border:"none",borderRadius:9,cursor:"pointer",fontFamily:"monospace",fontSize:13,fontWeight:"bold",transition:"all .2s"}}>
              {guardando?<><span className="spin">⟳</span> Creando en Drive...</>:"☁️ CREAR Y GUARDAR EN DRIVE"}
            </button>
            <button onClick={()=>setVista("agenda")} style={{padding:"13px 18px",background:"#1e293b",color:"#94a3b8",border:"1px solid #334155",borderRadius:9,cursor:"pointer",fontFamily:"monospace",fontSize:13}}>Cancelar</button>
          </div>
        </div>
      )}

      {/* DETALLE */}
      {vista==="detalle"&&seleccionado&&(()=>{
        const s=seleccionado; const ci=DRIVE.cias[s.cia]; const et=etapaDe(s); const ei=etapaIdx(s);
        return(
          <div className="fade" style={{padding:"20px 24px",display:"grid",gridTemplateColumns:"1fr 300px",gap:18}}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:"#0d1225",border:"1px solid #1e3a5f",borderRadius:11,padding:"18px",borderLeft:`4px solid ${et.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{display:"flex",gap:7,marginBottom:6}}>
                      <span style={{background:(ci?.color||"#64748b")+"33",color:ci?.color||"#64748b",fontSize:10,padding:"2px 9px",borderRadius:9,fontWeight:"bold"}}>{s.cia}</span>
                      <span style={{background:PRIO_C[s.prioridad]+"33",color:PRIO_C[s.prioridad]||"#64748b",fontSize:10,padding:"2px 9px",borderRadius:9,fontWeight:"bold"}}>● {(s.prioridad||"media").toUpperCase()}</span>
                    </div>
                    <div style={{fontSize:22,fontWeight:"bold",color:"#f1f5f9"}}>{s.id}</div>
                    <div style={{color:"#94a3b8",fontSize:13}}>{s.asegurado} | {s.tipo} | {s.vehiculo}</div>
                    <div style={{color:"#475569",fontSize:11,marginTop:3}}>Ingresado: {s.fecha_ingreso} — Agente: {s.agente}</div>
                  </div>
                  <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:16,fontSize:12,fontWeight:"bold",background:et.color+"33",color:et.color}}>{et.icon} {et.label}</span>
                </div>
                <div style={{display:"flex",gap:0,borderRadius:7,overflow:"hidden"}}>
                  {ETAPAS.map((e,i)=><div key={e.id} style={{flex:1,padding:"5px 3px",textAlign:"center",fontSize:9,background:i<ei?e.color+"55":i===ei?e.color:"#1e293b",color:i<=ei?"#fff":"#475569",fontWeight:i===ei?"bold":"normal"}}>{e.icon} {e.label.split(" ")[0]}</div>)}
                </div>
              </div>

              {ei<ETAPAS.length-1&&(
                <button className="btn" onClick={avanzarEtapa} disabled={guardando} style={{padding:"11px",background:"linear-gradient(135deg,#1d4ed8,#0891b2)",color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontFamily:"monospace",fontSize:13,fontWeight:"bold",transition:"all .2s"}}>
                  {guardando?<><span className="spin">⟳</span> Guardando en Drive...</>:`▶ AVANZAR A: ${ETAPAS[ei+1]?.icon} ${ETAPAS[ei+1]?.label} → guardar en Drive`}
                </button>
              )}

              <div style={{background:"#0d1225",border:"1px solid #1e3a5f",borderRadius:11,padding:"16px"}}>
                <div style={{fontFamily:"monospace",fontSize:10,color:"#60a5fa",letterSpacing:2,marginBottom:10}}>📋 HISTORIAL — guardado en Drive</div>
                {(s.log||[]).length===0&&<div style={{color:"#334155",fontSize:12}}>Sin actividad registrada.</div>}
                {(s.log||[]).map((l,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:8,padding:"9px 12px",background:"#070b14",borderRadius:7,borderLeft:`3px solid ${l.tipo==="ia"?"#7c3aed":l.tipo==="usuario"?"#16a34a":"#475569"}`}}>
                    <span style={{fontSize:10,color:"#475569",minWidth:38}}>{l.fecha}</span>
                    <span style={{fontSize:12,color:"#cbd5e1",flex:1}}>{l.accion}</span>
                    <span style={{fontSize:9,color:l.tipo==="ia"?"#a78bfa":l.tipo==="usuario"?"#86efac":"#60a5fa",whiteSpace:"nowrap"}}>{l.tipo==="ia"?"🤖":"👤"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{background:"#051a10",border:"1px solid #16a34a",borderRadius:10,padding:"13px"}}>
                <div style={{fontFamily:"monospace",fontSize:10,color:"#16a34a",letterSpacing:2,marginBottom:8}}>☁️ GOOGLE DRIVE</div>
                {s.url_drive
                  ?<a href={s.url_drive} target="_blank" rel="noreferrer" style={{display:"block",padding:"8px 12px",background:"#16a34a22",border:"1px solid #16a34a55",borderRadius:7,color:"#86efac",textDecoration:"none",fontSize:12}}>📁 Abrir carpeta del siniestro →</a>
                  :<div style={{fontSize:11,color:"#334155"}}>Sin carpeta Drive asignada.</div>
                }
                <div style={{marginTop:7,fontSize:10,color:"#334155"}}>Cambios guardados automáticamente</div>
              </div>

              <div style={{background:"#0d1225",border:"1px solid #1e3a5f",borderRadius:10,padding:"13px"}}>
                <div style={{fontFamily:"monospace",fontSize:10,color:"#60a5fa",letterSpacing:2,marginBottom:8}}>⚡ ACCIONES</div>
                {[{label:"⚖️ Generar Dictamen IA",c:"#7c3aed"},{label:"📲 WhatsApp asegurado",c:"#16a34a"},{label:"📄 Descargar docs",c:"#0891b2"},{label:"📸 Scanner de daños (pronto)",c:"#475569"}].map((a,i)=>(
                  <button key={i} className="btn" style={{width:"100%",marginBottom:7,padding:"8px 11px",background:a.c+"22",color:a.c,border:`1px solid ${a.c}44`,borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:"bold",textAlign:"left",transition:"all .2s",fontFamily:"monospace"}}>{a.label}</button>
                ))}
              </div>

              <div style={{background:"#0d1225",border:"1px solid #1e3a5f",borderRadius:10,padding:"13px"}}>
                <div style={{fontFamily:"monospace",fontSize:10,color:"#60a5fa",letterSpacing:2,marginBottom:8}}>📌 TAREAS DEL AGENTE</div>
                {(s.tareas||[]).map((t,i)=><div key={i} style={{padding:"7px 10px",background:"#070b14",borderRadius:6,marginBottom:5,fontSize:12,color:"#cbd5e1"}}><span style={{color:"#f59e0b",marginRight:6}}>→</span>{t}</div>)}
                <div style={{display:"flex",gap:6,marginTop:6}}>
                  <input value={nuevaTarea} onChange={e=>setNuevaTarea(e.target.value)} onKeyDown={e=>e.key==="Enter"&&agregarTarea()} placeholder="Nueva tarea..." className="field"
                    style={{flex:1,padding:"7px 9px",background:"#070b14",border:"1px solid #1e3a5f",borderRadius:6,color:"#f1f5f9",fontSize:11,transition:"all .2s"}}/>
                  <button onClick={agregarTarea} disabled={guardando} style={{padding:"7px 12px",background:"#3b82f6",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>+</button>
                </div>
                <div style={{fontSize:10,color:"#334155",marginTop:5}}>Se guarda en Drive automáticamente</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
