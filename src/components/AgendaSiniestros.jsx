import { useState, useEffect, useCallback } from "react";

const DRIVE = {
  raiz:    "1UmFDRXhYp_un7eacG82kpzv8ItAcSy7-",
  indice:  "1y4zbvVW2EiaBnbc0KpPaKQrmtZyOpxoX",
  cias: {
    "Integrity Seguros": { id:"12aHCwv9EGAwmdylQWsRohRvByIUVISF-", color:"#5b21b6", bg:"#ede9fe" },
    "San Cristóbal":     { id:"1w-RBx3X7X9GwF5KEh6njn_yeLHO5GeEE", color:"#0369a1", bg:"#e0f2fe" },
    "MAPFRE":            { id:"1cANI2yCU5AJvv5x48aPYKr3siQIyRwem", color:"#b91c1c", bg:"#fee2e2" },
    "Provincia Seguros": { id:"1YGPnYXv0B-3T03Szv2rudKa4Iz7PSOon", color:"#166534", bg:"#dcfce7" },
    "Galeno":            { id:"1Yu_dwUnZEIgxtGuReDkDBnldvbtAF5rG", color:"#92400e", bg:"#fef3c7" },
    "_ARCHIVADOS":       { id:"1ANofF7ud0P9fqVWi-ccS_nnCuitUtOSV", color:"#374151", bg:"#f3f4f6" },
  },
  url_raiz:"https://drive.google.com/drive/folders/1UmFDRXhYp_un7eacG82kpzv8ItAcSy7-",
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
const CIAS_LIST = ["Integrity Seguros","San Cristóbal","MAPFRE","Provincia Seguros","Galeno"];
const AGENTE_URL = "https://agente-siniestros-production.up.railway.app";

async function llamarAgente(tarea, siniestro_id, cia, datos={}) {
  try {
    const res = await fetch(AGENTE_URL+"/ejecutar", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({siniestro_id, cia, tarea, datos})
    });
    return await res.json();
  } catch(e) { return {ok:false, mensaje:e.message}; }
}

async function callDriveAgent(instruction) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body: JSON.stringify({
      model:"claude-sonnet-4-5", max_tokens:2000,
      system:"Sos un agente que gestiona Google Drive para un sistema de siniestros. Respondé SOLO con JSON.",
      mcp_servers:[{type:"url",url:"https://drivemcp.googleapis.com/mcp/v1",name:"gdrive"}],
      messages:[{role:"user",content:instruction}],
    }),
  });
  const data = await res.json();
  return (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
}

async function leerSiniestros() {
  const ids = Object.values(DRIVE.cias).slice(0,5).map(c=>c.id).join(", ");
  const texto = await callDriveAgent(
    `Buscá todos los archivos "datos.json" dentro de subcarpetas de estas carpetas (IDs): ${ids}. Lee su contenido y retorná SOLO un array JSON: [{"id":"...","cia":"...","asegurado":"...","tipo":"...","etapa":"...","prioridad":"...","agente":"...","fecha_ingreso":"...","vehiculo":"...","folder_id":"...","url_drive":"...","tareas":[],"log":[]}]. Si no hay archivos retorná: []`
  );
  const match = texto.match(/\[[\s\S]*\]/);
  if(!match) return [];
  try { return JSON.parse(match[0]); } catch { return []; }
}

async function crearSiniestroEnDrive(datos) {
  const ciaInfo = DRIVE.cias[datos.cia];
  const nombre = `${datos.id} — ${datos.asegurado} — ${datos.tipo}`;
  const contenido = JSON.stringify({...datos,log:[{fecha:new Date().toLocaleDateString("es-AR"),accion:"Siniestro creado.",tipo:"sistema"}],dictamen:null,oferta:null,convenio:null,documentacion:[],ultimo_actualizado:new Date().toISOString()});
  const texto = await callDriveAgent(
    `1. Creá carpeta "${nombre}" dentro de ID "${ciaInfo.id}". 2. Creá "datos.json" con este contenido (application/json): ${contenido}. 3. Creá subcarpeta "documentos" adentro. Retorná SOLO: {"folder_id":"...","url_drive":"...","datos_id":"..."}`
  );
  const match = texto.match(/\{[\s\S]*\}/);
  if(!match) throw new Error("No se obtuvo respuesta de Drive");
  return JSON.parse(match[0]);
}

async function actualizarDatos(folderDriveId, datos) {
  const json = JSON.stringify({...datos,ultimo_actualizado:new Date().toISOString()});
  await callDriveAgent(`Buscá "datos.json" en carpeta ID "${folderDriveId}" y reemplazá TODO su contenido con: ${json}. Retorná: {"ok":true}`);
}

// ─── ESTILOS GLOBALES ─────────────────────────────────────────────────────────
const G = {
  fondo:     "#f5f7fa",
  fondoCard: "#ffffff",
  borde:     "#d1d9e0",
  texto:     "#111827",
  textoSec:  "#374151",
  textoTer:  "#6b7280",
  input:     { background:"#fff", border:"1px solid #d1d9e0", borderRadius:8, color:"#111827", fontSize:16, padding:"10px 14px", fontFamily:"inherit", width:"100%" },
};

export default function AgendaSiniestros() {
  const [siniestros,   setSiniestros]   = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState(null);
  const [filtro,       setFiltro]       = useState("todos");
  const [vista,        setVista]        = useState("agenda");
  const [seleccionado, setSeleccionado] = useState(null);
  const [guardando,    setGuardando]    = useState(false);
  const [notif,        setNotif]        = useState(null);
  const [nuevaTarea,   setNuevaTarea]   = useState("");
  const [formNuevo,    setFormNuevo]    = useState({
    cia:"Integrity Seguros", tipo:"Choque", asegurado:"", vehiculo:"",
    telefono:"", agente:"", prioridad:"media",
    fecha_ingreso:new Date().toLocaleDateString("es-AR"),
  });

  const showNotif = (msg, tipo="ok") => { setNotif({msg,tipo}); setTimeout(()=>setNotif(null),4000); };

  const cargar = useCallback(async()=>{
    setCargando(true); setError(null);
    try { setSiniestros(await leerSiniestros()); }
    catch(e) { setError(e.message); }
    finally { setCargando(false); }
  },[]);

  useEffect(()=>{ cargar(); },[]);

  const generarId = (cia) => {
    const p = {"Integrity Seguros":"INT","San Cristóbal":"SAN","MAPFRE":"MAP","Provincia Seguros":"PRO","Galeno":"GAL"}[cia]||"STR";
    return `${p}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
  };

  const crearNuevo = async() => {
    if(!formNuevo.asegurado.trim()) return;
    setGuardando(true);
    try {
      const id = generarId(formNuevo.cia);
      const datos = {...formNuevo, id, etapa:"recepcion", tareas:["Solicitar documentación inicial"]};
      const result = await crearSiniestroEnDrive(datos);
      const nuevo = {...datos, folder_id:result.folder_id, url_drive:result.url_drive, log:[{fecha:new Date().toLocaleDateString("es-AR"),accion:"Siniestro creado.",tipo:"sistema"}]};
      setSiniestros(prev=>[nuevo,...prev]);
      setVista("agenda");
      showNotif(`✅ ${id} creado en Drive`);
    } catch(e) { showNotif("❌ "+e.message,"error"); }
    finally { setGuardando(false); }
  };

  const avanzarEtapa = async() => {
    const s = seleccionado;
    const idx = ETAPAS.findIndex(e=>e.id===s.etapa);
    if(idx>=ETAPAS.length-1) return;
    const nueva = ETAPAS[idx+1];
    const actualizado = {...s, etapa:nueva.id, log:[...(s.log||[]),{fecha:new Date().toLocaleDateString("es-AR"),accion:`→ ${nueva.label}`,tipo:"usuario"}]};
    setGuardando(true);
    try {
      await actualizarDatos(s.folder_id, actualizado);
      setSiniestros(prev=>prev.map(x=>x.id===s.id?actualizado:x));
      setSeleccionado(actualizado);
      showNotif(`📊 Avanzado a ${nueva.label} · Guardado ☁️`);
    } catch(e) { showNotif("❌ "+e.message,"error"); }
    finally { setGuardando(false); }
  };

  const agregarTarea = async() => {
    if(!nuevaTarea.trim()||!seleccionado) return;
    const actualizado = {...seleccionado, tareas:[...(seleccionado.tareas||[]),nuevaTarea]};
    setGuardando(true);
    try {
      await actualizarDatos(seleccionado.folder_id, actualizado);
      setSiniestros(prev=>prev.map(x=>x.id===seleccionado.id?actualizado:x));
      setSeleccionado(actualizado);
      setNuevaTarea("");
      showNotif("📌 Tarea guardada");
    } catch(e) { showNotif("❌ "+e.message,"error"); }
    finally { setGuardando(false); }
  };

  const filtrados = filtro==="todos" ? siniestros : siniestros.filter(s=>s.cia===filtro);
  const etapaDe  = s => ETAPAS.find(e=>e.id===s.etapa)||ETAPAS[0];
  const etapaIdx = s => ETAPAS.findIndex(e=>e.id===s.etapa);

  const CI = name => DRIVE.cias[name]||{color:"#374151",bg:"#f3f4f6"};

  return (
    <div style={{fontFamily:"'Segoe UI',Arial,sans-serif",background:G.fondo,minHeight:"100vh",color:G.texto,fontSize:16}}>
      <style>{`
        *{box-sizing:border-box}
        .card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.12)!important}
        .btn:hover{filter:brightness(.93)}
        .fade{animation:fi .35s ease}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .spin{animation:sp 1s linear infinite;display:inline-block}
        @keyframes sp{to{transform:rotate(360deg)}}
        input:focus,select:focus,textarea:focus{outline:3px solid #5b21b6!important;border-color:#5b21b6!important}
        input,select,textarea{font-family:inherit}
      `}</style>

      {/* NOTIFICACIÓN */}
      {notif&&<div className="fade" style={{position:"fixed",top:18,right:18,zIndex:9999,background:notif.tipo==="ok"?"#166534":"#991b1b",color:"#fff",padding:"14px 22px",borderRadius:10,fontSize:16,fontWeight:"bold",boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>{notif.msg}</div>}

      {/* HEADER */}
      <div style={{background:"#1e293b",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {vista!=="agenda"&&<button onClick={()=>setVista("agenda")} style={{background:"#334155",border:"none",color:"#e2e8f0",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:15}}>← Volver</button>}
          <span style={{fontSize:22,fontWeight:"bold",color:"#f8fafc",letterSpacing:1}}>⚡ GIANOGLIO PERITACIONES</span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {guardando&&<span style={{color:"#93c5fd",fontSize:15}}><span className="spin">⟳</span> Guardando...</span>}
          <button className="btn" onClick={cargar} style={{padding:"8px 16px",background:"#334155",border:"none",color:"#e2e8f0",borderRadius:8,cursor:"pointer",fontSize:15}}>🔄 Actualizar</button>
          <a href={DRIVE.url_raiz} target="_blank" rel="noreferrer" style={{padding:"8px 16px",background:"#334155",color:"#93c5fd",borderRadius:8,fontSize:15,textDecoration:"none"}}>📁 Drive</a>
          {vista==="agenda"&&<button className="btn" onClick={()=>setVista("nuevo")} style={{padding:"9px 20px",background:"#5b21b6",border:"none",color:"#fff",borderRadius:8,cursor:"pointer",fontSize:16,fontWeight:"bold"}}>+ Nuevo Siniestro</button>}
        </div>
      </div>

      {/* AGENDA */}
      {vista==="agenda"&&(
        <div style={{padding:"24px"}}>
          {/* Filtros CIA */}
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            {["todos",...CIAS_LIST].map(c=>{
              const ci = CI(c);
              const activo = filtro===c;
              return <button key={c} onClick={()=>setFiltro(c)} style={{padding:"8px 18px",borderRadius:20,border:`2px solid ${activo?ci.color:"#d1d9e0"}`,cursor:"pointer",fontSize:15,fontWeight:"bold",background:activo?ci.bg:"#fff",color:activo?ci.color:G.textoSec,transition:"all .2s"}}>{c==="todos"?"📋 TODOS":c.toUpperCase()}</button>;
            })}
          </div>

          {/* Pipeline */}
          <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:6}}>
            {ETAPAS.map(e=>{
              const n=siniestros.filter(s=>s.etapa===e.id).length;
              return <div key={e.id} style={{flex:"0 0 auto",textAlign:"center",padding:"10px 16px",background:"#fff",borderRadius:10,minWidth:100,border:`1px solid ${e.color}`,boxShadow:"0 2px 6px rgba(0,0,0,.06)"}}>
                <div style={{fontSize:20}}>{e.icon}</div>
                <div style={{fontSize:13,color:G.textoTer,fontWeight:"bold",marginTop:2}}>{e.label}</div>
                <div style={{fontSize:26,fontWeight:"bold",color:e.color}}>{n}</div>
              </div>;
            })}
          </div>

          {cargando&&<div style={{textAlign:"center",padding:"60px",color:G.textoSec}}><div style={{fontSize:40,marginBottom:14}}><span className="spin">⟳</span></div><div style={{fontSize:17}}>Cargando desde Google Drive...</div></div>}
          {error&&<div style={{padding:"18px",background:"#fee2e2",border:"2px solid #dc2626",borderRadius:10,color:"#7f1d1d",fontSize:16}}>⚠ {error} <button onClick={cargar} style={{marginLeft:12,padding:"6px 14px",background:"#dc2626",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:15}}>Reintentar</button></div>}

          {!cargando&&!error&&(
            <div style={{display:"grid",gap:12}}>
              {filtrados.length===0&&<div style={{textAlign:"center",padding:"60px",color:G.textoTer,fontSize:17}}><div style={{fontSize:40,marginBottom:12}}>📂</div>No hay siniestros. Creá el primero.</div>}
              {filtrados.map(s=>{
                const ci=CI(s.cia); const et=etapaDe(s); const ei=etapaIdx(s);
                return <div key={s.id} className="card" onClick={()=>{setSeleccionado(s);setVista("detalle")}} style={{background:"#fff",border:"1px solid "+G.borde,borderRadius:12,padding:"16px 20px",cursor:"pointer",transition:"all .2s",borderLeft:`5px solid ${et.color}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",alignItems:"center",gap:16,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                  <div>
                    <div style={{display:"flex",gap:8,marginBottom:6}}>
                      <span style={{background:ci.bg,color:ci.color,fontSize:13,padding:"3px 10px",borderRadius:10,fontWeight:"bold"}}>{s.cia}</span>
                      <span style={{background:PRIO_C[s.prioridad]+"22",color:PRIO_C[s.prioridad],fontSize:13,padding:"3px 10px",borderRadius:10,fontWeight:"bold"}}>● {(s.prioridad||"media").toUpperCase()}</span>
                    </div>
                    <div style={{fontWeight:"bold",fontSize:18,color:G.texto}}>{s.id}</div>
                    <div style={{color:G.textoSec,fontSize:15}}>{s.asegurado} — {s.tipo}</div>
                    <div style={{color:G.textoTer,fontSize:14}}>{s.vehiculo}</div>
                  </div>
                  <div>
                    <div style={{fontSize:13,color:G.textoTer,marginBottom:5,fontWeight:"bold"}}>ETAPA</div>
                    <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:16,fontSize:15,fontWeight:"bold",background:et.color+"18",color:et.color,border:`1px solid ${et.color}`}}>{et.icon} {et.label}</span>
                    <div style={{display:"flex",gap:3,marginTop:8}}>{ETAPAS.map((e,i)=><div key={e.id} style={{flex:1,height:5,borderRadius:3,background:i<=ei?et.color:"#e5e7eb"}}/>)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:13,color:G.textoTer,fontWeight:"bold",marginBottom:5}}>PRÓXIMAS TAREAS</div>
                    {(s.tareas||[]).slice(0,2).map((t,i)=><div key={i} style={{fontSize:14,color:G.textoSec,marginBottom:3}}>→ {t}</div>)}
                    {(s.tareas||[]).length>2&&<div style={{fontSize:13,color:G.textoTer}}>+{s.tareas.length-2} más</div>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,color:G.textoTer}}>{s.fecha_ingreso}</div>
                    <div style={{fontSize:14,color:"#5b21b6",marginTop:4,fontWeight:"bold"}}>{s.agente}</div>
                    {s.url_drive&&<a href={s.url_drive} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:13,color:"#166534",textDecoration:"none",fontWeight:"bold"}}>📁 Drive</a>}
                  </div>
                </div>;
              })}
            </div>
          )}
        </div>
      )}

      {/* NUEVO SINIESTRO */}
      {vista==="nuevo"&&(
        <div className="fade" style={{padding:"28px",maxWidth:700,margin:"0 auto"}}>
          <div style={{fontSize:20,fontWeight:"bold",color:G.texto,marginBottom:20}}>📥 Nuevo Siniestro → se guardará en Google Drive</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[
              {l:"COMPAÑÍA",k:"cia",t:"select",ops:CIAS_LIST},
              {l:"TIPO",k:"tipo",t:"select",ops:["Choque","Granizo","Robo Parcial","Robo Total","Incendio","Daño Parcial","Atropello","Otro"]},
              {l:"ASEGURADO *",k:"asegurado",t:"input"},{l:"VEHÍCULO",k:"vehiculo",t:"input"},
              {l:"TELÉFONO",k:"telefono",t:"input"},{l:"AGENTE",k:"agente",t:"input"},
              {l:"PRIORIDAD",k:"prioridad",t:"select",ops:["alta","media","baja"]},
              {l:"FECHA INGRESO",k:"fecha_ingreso",t:"input"},
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
          <div style={{margin:"16px 0",padding:"12px 16px",background:"#ede9fe",borderRadius:10,fontSize:15,color:"#5b21b6",fontWeight:"bold"}}>
            📁 Drive / AGENDA SINIESTROS / {formNuevo.cia} / {generarId(formNuevo.cia)} — {formNuevo.asegurado||"[asegurado]"}
          </div>
          <div style={{display:"flex",gap:12}}>
            <button className="btn" onClick={crearNuevo} disabled={!formNuevo.asegurado.trim()||guardando} style={{flex:1,padding:"14px",background:formNuevo.asegurado.trim()?"#5b21b6":"#9ca3af",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:17,fontWeight:"bold"}}>
              {guardando?<><span className="spin">⟳</span> Creando en Drive...</>:"☁️ CREAR Y GUARDAR EN DRIVE"}
            </button>
            <button onClick={()=>setVista("agenda")} style={{padding:"14px 20px",background:"#fff",color:G.textoSec,border:`2px solid ${G.borde}`,borderRadius:10,cursor:"pointer",fontSize:16}}>Cancelar</button>
          </div>
        </div>
      )}

      {/* DETALLE */}
      {vista==="detalle"&&seleccionado&&(()=>{
        const s=seleccionado; const ci=CI(s.cia); const et=etapaDe(s); const ei=etapaIdx(s);
        return(
          <div className="fade" style={{padding:"24px",display:"grid",gridTemplateColumns:"1fr 320px",gap:20}}>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Header */}
              <div style={{background:"#fff",border:`1px solid ${G.borde}`,borderRadius:12,padding:"20px",borderLeft:`6px solid ${et.color}`,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{display:"flex",gap:8,marginBottom:8}}>
                      <span style={{background:ci.bg,color:ci.color,fontSize:14,padding:"4px 12px",borderRadius:10,fontWeight:"bold"}}>{s.cia}</span>
                      <span style={{background:PRIO_C[s.prioridad]+"22",color:PRIO_C[s.prioridad],fontSize:14,padding:"4px 12px",borderRadius:10,fontWeight:"bold"}}>● {(s.prioridad||"media").toUpperCase()}</span>
                    </div>
                    <div style={{fontSize:26,fontWeight:"bold",color:G.texto}}>{s.id}</div>
                    <div style={{color:G.textoSec,fontSize:16}}>{s.asegurado} | {s.tipo} | {s.vehiculo}</div>
                    <div style={{color:G.textoTer,fontSize:14,marginTop:4}}>Ingresado: {s.fecha_ingreso} — Agente: {s.agente}</div>
                  </div>
                  <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:16,fontSize:15,fontWeight:"bold",background:et.color+"18",color:et.color,border:`2px solid ${et.color}`}}>{et.icon} {et.label}</span>
                </div>
                <div style={{display:"flex",gap:3,borderRadius:8,overflow:"hidden"}}>
                  {ETAPAS.map((e,i)=><div key={e.id} style={{flex:1,padding:"6px 4px",textAlign:"center",fontSize:12,background:i<ei?e.color+"33":i===ei?e.color:"#f3f4f6",color:i<=ei?i===ei?"#fff":e.color:"#9ca3af",fontWeight:i===ei?"bold":"normal"}}>{e.icon}</div>)}
                </div>
              </div>

              {/* Botón avanzar */}
              {ei<ETAPAS.length-1&&(
                <button className="btn" onClick={avanzarEtapa} disabled={guardando} style={{padding:"14px",background:"#1e40af",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:17,fontWeight:"bold"}}>
                  {guardando?<><span className="spin">⟳</span> Guardando...</>:`▶ AVANZAR A: ${ETAPAS[ei+1]?.icon} ${ETAPAS[ei+1]?.label}`}
                </button>
              )}

              {/* Historial */}
              <div style={{background:"#fff",border:`1px solid ${G.borde}`,borderRadius:12,padding:"18px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                <div style={{fontSize:16,fontWeight:"bold",color:G.texto,marginBottom:12}}>📋 HISTORIAL DE ACTIVIDAD</div>
                {(s.log||[]).length===0&&<div style={{color:G.textoTer,fontSize:15}}>Sin actividad registrada.</div>}
                {(s.log||[]).map((l,i)=>(
                  <div key={i} style={{display:"flex",gap:12,marginBottom:10,padding:"10px 14px",background:G.fondo,borderRadius:8,borderLeft:`4px solid ${l.tipo==="ia"?"#5b21b6":l.tipo==="usuario"?"#166534":"#9ca3af"}`}}>
                    <span style={{fontSize:14,color:G.textoTer,minWidth:44,fontWeight:"bold"}}>{l.fecha}</span>
                    <span style={{fontSize:15,color:G.texto,flex:1}}>{l.accion}</span>
                    <span style={{fontSize:13,color:l.tipo==="ia"?"#5b21b6":l.tipo==="usuario"?"#166534":"#9ca3af",fontWeight:"bold",whiteSpace:"nowrap"}}>{l.tipo==="ia"?"🤖 IA":l.tipo==="usuario"?"👤 Perito":"⚙️"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {/* Drive */}
              <div style={{background:"#dcfce7",border:"2px solid #166534",borderRadius:10,padding:"14px"}}>
                <div style={{fontSize:15,fontWeight:"bold",color:"#166534",marginBottom:8}}>☁️ GOOGLE DRIVE</div>
                {s.url_drive
                  ?<a href={s.url_drive} target="_blank" rel="noreferrer" style={{display:"block",padding:"10px 14px",background:"#fff",border:"2px solid #166534",borderRadius:8,color:"#166534",textDecoration:"none",fontSize:15,fontWeight:"bold"}}>📁 Abrir carpeta del siniestro →</a>
                  :<div style={{fontSize:14,color:"#6b7280"}}>Sin carpeta Drive.</div>
                }
              </div>

              {/* Acciones */}
              <div style={{background:"#fff",border:`1px solid ${G.borde}`,borderRadius:10,padding:"14px",boxShadow:"0 2px 6px rgba(0,0,0,.06)"}}>
                <div style={{fontSize:15,fontWeight:"bold",color:G.texto,marginBottom:10}}>⚡ ACCIONES</div>
                {[
                  {label:"🤖 Escanear Integrity",c:"#166534",bg:"#dcfce7",fn:()=>llamarAgente("escanear_nuevos","*","Integrity Seguros").then(r=>showNotif(r.mensaje||"Escaneando..."))},
                  {label:"⚖️ Generar Dictamen IA",c:"#5b21b6",bg:"#ede9fe",fn:null},
                  {label:"📲 WhatsApp asegurado",c:"#0369a1",bg:"#e0f2fe",fn:null},
                  {label:"📄 Descargar docs",c:"#1e40af",bg:"#dbeafe",fn:null},
                  {label:"📸 Scanner de daños (pronto)",c:"#6b7280",bg:"#f3f4f6",fn:null},
                ].map((a,i)=>(
                  <button key={i} className="btn" onClick={()=>a.fn&&a.fn()} style={{width:"100%",marginBottom:8,padding:"10px 14px",background:a.bg,color:a.c,border:`2px solid ${a.c}`,borderRadius:8,cursor:"pointer",fontSize:15,fontWeight:"bold",textAlign:"left"}}>
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Tareas */}
              <div style={{background:"#fff",border:`1px solid ${G.borde}`,borderRadius:10,padding:"14px",boxShadow:"0 2px 6px rgba(0,0,0,.06)"}}>
                <div style={{fontSize:15,fontWeight:"bold",color:G.texto,marginBottom:10}}>📌 TAREAS DEL AGENTE</div>
                {(s.tareas||[]).map((t,i)=><div key={i} style={{padding:"8px 12px",background:G.fondo,borderRadius:8,marginBottom:6,fontSize:15,color:G.textoSec,borderLeft:"4px solid #d97706"}}><span style={{color:"#d97706",marginRight:8}}>→</span>{t}</div>)}
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <input value={nuevaTarea} onChange={e=>setNuevaTarea(e.target.value)} onKeyDown={e=>e.key==="Enter"&&agregarTarea()} placeholder="Nueva tarea para el agente..." style={{...G.input,fontSize:15}}/>
                  <button onClick={agregarTarea} disabled={guardando} style={{padding:"10px 16px",background:"#5b21b6",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:16,fontWeight:"bold"}}>+</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
