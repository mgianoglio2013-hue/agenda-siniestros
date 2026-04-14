# 🗂️ Agenda Siniestros v3 — Sistema de Gestión de Peritación

## Arquitectura

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│     CLOUDFLARE PAGES            │     │     RAILWAY                     │
│     (agenda-siniestros.pages)   │     │     (agente-siniestros)         │
│                                 │     │                                 │
│  AgendaSiniestros.jsx          │────▶│  servidor_v3.py                │
│  - Vista de siniestros          │     │  - GET /siniestros              │
│  - Filtros por compañía         │     │  - POST /ejecutar               │
│  - Cambio de etapas             │     │  - GET /gmail/test              │
│                                 │     │                                 │
└─────────────────────────────────┘     └────────────┬────────────────────┘
                                                     │
                                                     ▼
                                        ┌─────────────────────────────────┐
                                        │     GOOGLE DRIVE                │
                                        │                                 │
                                        │  📁 AGENDA SINIESTROS           │
                                        │     ├── Integrity Seguros       │
                                        │     ├── San Cristóbal           │
                                        │     ├── MAPFRE                  │
                                        │     └── ...                     │
                                        └─────────────────────────────────┘
```

## ⚠️ ¿Por qué la versión anterior no funcionaba?

La agenda anterior usaba `fetch("https://api.anthropic.com/v1/messages"` con `mcp_servers` de Google Drive.
Eso **solo funciona dentro de Claude.ai** donde el usuario está autenticado con Google.

Cuando la agenda se despliega en Cloudflare Pages, **no tiene esa autenticación** → Drive devuelve vacío.

## ✅ La solución (v3)

1. El **servidor en Railway** tiene credenciales de Google configuradas
2. La agenda llama a `GET /siniestros` del servidor de Railway
3. El servidor lee Drive con la API de Google y devuelve los datos

## 🚀 Deployment

### 1. Railway (Backend)

```bash
# En el repo del agente
cp .env.example .env
# Editar .env con tus credenciales

# Railway detecta automáticamente que es Python
railway up
```

Variables de entorno necesarias en Railway:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ACCESS_TOKEN`
- `GOOGLE_REFRESH_TOKEN`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

### 2. Cloudflare Pages (Frontend)

1. Subir `AgendaSiniestros.jsx` al repo de GitHub
2. En `src/components/AgendaSiniestros.jsx`
3. Cloudflare Pages deploya automáticamente

### 3. Obtener tokens de Google

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto o usar existente
3. Habilitar "Google Drive API"
4. Crear credenciales OAuth 2.0
5. Descargar `client_secret.json`
6. Ejecutar este script para obtener tokens:

```python
from google_auth_oauthlib.flow import InstalledAppFlow
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
creds = flow.run_local_server(port=0)
print(f"ACCESS_TOKEN={creds.token}")
print(f"REFRESH_TOKEN={creds.refresh_token}")
```

## 📂 Estructura de carpetas en Drive

```
📁 AGENDA SINIESTROS
├── 📁 Integrity Seguros
│   ├── 📁 STRO-12345-GARCIA
│   ├── 📁 STRO-12346-LOPEZ
│   └── ...
├── 📁 San Cristóbal
├── 📁 MAPFRE
├── 📁 Provincia Seguros
├── 📁 Galeno
└── 📁 _ARCHIVO CERRADOS
```

## 🧪 Testing

```bash
# Verificar que el servidor está online
curl https://agente-siniestros-production.up.railway.app/

# Verificar lectura de siniestros
curl https://agente-siniestros-production.up.railway.app/siniestros

# Verificar Gmail
curl https://agente-siniestros-production.up.railway.app/gmail/test
```

## 📝 Notas

- Los tokens de Google expiran y se refreshean automáticamente
- El servidor usa el `refresh_token` para renovar el `access_token`
- Las carpetas que empiezan con `ZZ` o `_` se excluyen del listado
