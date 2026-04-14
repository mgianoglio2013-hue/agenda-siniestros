"""
Servidor del agente v3 — con endpoint /siniestros que lee Drive directamente
Para Railway deployment
"""

import os
import asyncio
import logging
import threading
from typing import List, Dict, Any
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Google Drive API
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("servidor-agente")

app = FastAPI(title="Agente Siniestros v3", version="3.0.0")

# CORS para Cloudflare Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── CONFIG DRIVE ───────────────────────────────────────────────────────────────
DRIVE_CIAS = {
    "Integrity Seguros":    {"id": os.getenv("FOLDER_INTEGRITY", "12aHCwv9EGAwmdylQWsRohRvByIUVISF-"), "color": "#5b21b6", "bg": "#ede9fe"},
    "San Cristóbal":        {"id": os.getenv("FOLDER_SAN_CRISTOBAL", "1w-RBx3X7X9GwF5KEh6njn_yeLHO5GeEE"), "color": "#0369a1", "bg": "#e0f2fe"},
    "MAPFRE":               {"id": os.getenv("FOLDER_MAPFRE", "1cANI2yCU5AJvv5x48aPYKr3siQIyRwem"), "color": "#b91c1c", "bg": "#fee2e2"},
    "Provincia Seguros":    {"id": os.getenv("FOLDER_PROVINCIA", "1YGPnYXv0B-3T03Szv2rudKa4Iz7PSOon"), "color": "#166534", "bg": "#dcfce7"},
    "Galeno":               {"id": os.getenv("FOLDER_GALENO", "1Yu_dwUnZEIgxtGuReDkDBnldvbtAF5rG"), "color": "#92400e", "bg": "#fef3c7"},
}

# ─── MODELOS ────────────────────────────────────────────────────────────────────
class OrdenTarea(BaseModel):
    siniestro_id: str
    cia: str
    tarea: str
    datos: dict = {}

class RespuestaAgente(BaseModel):
    ok: bool
    mensaje: str
    datos: dict = {}

class Siniestro(BaseModel):
    id: str
    cia: str
    asegurado: str
    tipo: str
    vehiculo: str
    telefono: str
    agente: str
    prioridad: str
    fecha_ingreso: str
    etapa: str
    folder_id: str
    url_drive: str
    tareas: List[str] = []
    log: List[str] = []

# ─── GOOGLE DRIVE SERVICE ───────────────────────────────────────────────────────
def get_drive_service():
    """Crea cliente de Drive usando credenciales de variables de entorno"""
    try:
        creds = Credentials(
            token=os.getenv("GOOGLE_ACCESS_TOKEN"),
            refresh_token=os.getenv("GOOGLE_REFRESH_TOKEN"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        )
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Guardar nuevo token si se refresheó
            log.info("Token de Google refresheado")
        return build("drive", "v3", credentials=creds)
    except Exception as e:
        log.error(f"Error conectando a Drive: {e}")
        return None

def detectar_etapa(nombre: str) -> str:
    """Detecta la etapa del siniestro por el nombre de la carpeta"""
    n = nombre.upper()
    if "CERRAD" in n or "PAGAD" in n: return "cierre"
    if "CONVEN" in n: return "convenio"
    if "TERC" in n or "OFERT" in n: return "oferta"
    if "INF" in n or "01F" in n or "02F" in n or "03F" in n: return "informe"
    return "recepcion"

def leer_carpetas_cia(service, cia_name: str, folder_id: str) -> List[Dict]:
    """Lee las subcarpetas de una compañía de seguros"""
    try:
        results = service.files().list(
            q=f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="files(id, name, webViewLink)",
            pageSize=100,
        ).execute()
        
        carpetas = results.get("files", [])
        siniestros = []
        
        for c in carpetas:
            nombre = c.get("name", "")
            # Excluir carpetas de archivo
            if nombre.startswith("ZZ") or nombre.startswith("_"):
                continue
                
            siniestros.append({
                "id": nombre,
                "cia": cia_name,
                "asegurado": nombre,
                "tipo": "Choque",
                "vehiculo": "",
                "telefono": "",
                "agente": "Gianoglio",
                "prioridad": "media",
                "fecha_ingreso": "",
                "etapa": detectar_etapa(nombre),
                "folder_id": c.get("id"),
                "url_drive": c.get("webViewLink") or f"https://drive.google.com/drive/folders/{c.get('id')}",
                "tareas": [],
                "log": [],
            })
        
        return siniestros
    except Exception as e:
        log.error(f"Error leyendo {cia_name}: {e}")
        return []

# ─── ENDPOINTS ──────────────────────────────────────────────────────────────────
@app.get("/")
async def health():
    return {
        "status": "online",
        "agente": "Gianoglio Peritaciones",
        "version": "3.0",
        "gmail_monitor": "activo",
        "gmail_user": os.getenv("GMAIL_USER", "no configurado")
    }

@app.get("/siniestros")
async def obtener_siniestros(cia: str = None):
    """
    Endpoint principal para la agenda — lee siniestros de Drive
    Params:
        cia: filtrar por compañía (opcional)
    """
    service = get_drive_service()
    if not service:
        return {"ok": False, "error": "No se pudo conectar a Google Drive", "siniestros": []}
    
    todos = []
    cias_a_leer = {cia: DRIVE_CIAS[cia]} if cia and cia in DRIVE_CIAS else DRIVE_CIAS
    
    for cia_name, info in cias_a_leer.items():
        log.info(f"Leyendo {cia_name}...")
        stros = leer_carpetas_cia(service, cia_name, info["id"])
        todos.extend(stros)
        log.info(f"  → {len(stros)} siniestros encontrados")
    
    return {
        "ok": True,
        "siniestros": todos,
        "total": len(todos),
        "cias": list(DRIVE_CIAS.keys()),
    }

@app.get("/cias")
async def obtener_cias():
    """Devuelve la configuración de compañías"""
    return {
        "ok": True,
        "cias": {
            k: {"color": v["color"], "bg": v["bg"]}
            for k, v in DRIVE_CIAS.items()
        }
    }

@app.post("/ejecutar", response_model=RespuestaAgente)
async def ejecutar_tarea(orden: OrdenTarea, background_tasks: BackgroundTasks):
    log.info(f"Orden: {orden.tarea} | {orden.siniestro_id} | {orden.cia}")

    if orden.cia == "Integrity Seguros":
        if orden.tarea == "escanear_nuevos":
            background_tasks.add_task(escanear_integrity)
            origen = orden.datos.get("origen", "manual")
            return RespuestaAgente(ok=True, mensaje=f"🔍 Escaneando Integrity... (origen: {origen})")

        elif orden.tarea == "procesar":
            background_tasks.add_task(procesar_integrity, orden.siniestro_id)
            return RespuestaAgente(ok=True, mensaje=f"⚙️ Procesando {orden.siniestro_id}...")

        elif orden.tarea == "enviar_oferta":
            monto = orden.datos.get("monto", 0)
            telefono = orden.datos.get("telefono", "")
            nombre = orden.datos.get("nombre", "")
            background_tasks.add_task(enviar_oferta, orden.siniestro_id, telefono, monto, nombre)
            return RespuestaAgente(ok=True, mensaje=f"💬 Enviando oferta ${monto:,.0f} por WhatsApp...")

        elif orden.tarea == "generar_convenio":
            background_tasks.add_task(generar_convenio, orden.siniestro_id, orden.datos)
            return RespuestaAgente(ok=True, mensaje="📝 Generando convenio de indemnización...")

    return RespuestaAgente(ok=False, mensaje=f"Tarea '{orden.tarea}' no reconocida")


@app.get("/estado/{siniestro_id}")
async def estado(siniestro_id: str):
    return {"siniestro_id": siniestro_id, "status": "consultando en Integrity..."}


@app.get("/gmail/test")
async def test_gmail():
    """Prueba la conexión con Gmail"""
    try:
        from monitor_gmail import leer_mails_integrity
        mails = await leer_mails_integrity()
        return {"ok": True, "mails_encontrados": len(mails), "mails": mails}
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ─── TAREAS ─────────────────────────────────────────────────────────────────────
async def escanear_integrity():
    try:
        from agente_integrity import main
        await main()
    except Exception as e:
        log.error(f"Error escaneando Integrity: {e}")


async def procesar_integrity(siniestro_id: str):
    log.info(f"Procesando {siniestro_id} en Integrity")


async def enviar_oferta(siniestro_id: str, telefono: str, monto: float, nombre: str):
    try:
        from agente_integrity import enviar_oferta_whatsapp
        await enviar_oferta_whatsapp(telefono, monto, nombre, siniestro_id)
    except Exception as e:
        log.error(f"Error enviando oferta: {e}")


async def generar_convenio(siniestro_id: str, datos: dict):
    try:
        from generador_documentos import generar_convenio_word
        await generar_convenio_word(siniestro_id, datos)
    except Exception as e:
        log.error(f"Error generando convenio: {e}")


# ─── INICIO CON MONITOR GMAIL ───────────────────────────────────────────────────
def iniciar_monitor_gmail():
    """Inicia el monitor de Gmail en un thread separado"""
    async def run():
        from monitor_gmail import loop_monitor
        await loop_monitor()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run())


@app.on_event("startup")
async def startup():
    log.info("🚀 Agente v3 iniciando...")
    # Monitor Gmail en thread separado para no bloquear el servidor
    t = threading.Thread(target=iniciar_monitor_gmail, daemon=True)
    t.start()
    log.info("📬 Monitor Gmail iniciado en background")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("servidor_v3:app", host="0.0.0.0", port=port, reload=False)
