import { useState } from "react";

// Ley de Tránsito Argentina - Artículos relevantes
const ARTICULOS = {
  "39": "Prioridad de paso - El que viene por la derecha tiene prioridad",
  "40": "Giros - Debe advertir con luz de giro con 30m de antelación",
  "41": "Adelantamiento - Solo por la izquierda",
  "42": "Velocidad - Prohibido variar bruscamente",
  "43": "Marcha atrás - Debe asegurarse de no embestir",
  "48": "Velocidad máxima - 40km/h calles, 60km/h avenidas",
  "50": "Prohibiciones - No conducir con impedimentos"
};

// Palabras clave para detectar infracciones
const PATRONES_CULPA = [
  { palabras: ["marcha atrás", "marcha atras", "retrocediendo", "retroceder"], articulo: "43", culpa: 100, descripcion: "Maniobra de marcha atrás sin precaución" },
  { palabras: ["no cedí", "no cedi", "no le di paso", "no frené", "no frene"], articulo: "39", culpa: 80, descripcion: "No ceder el paso" },
  { palabras: ["giré sin", "gire sin", "doblé sin", "doble sin", "sin señalizar"], articulo: "40", culpa: 70, descripcion: "Giro sin señalización" },
  { palabras: ["estacionado", "detenido", "parado"], articulo: "43", culpa: 0, descripcion: "Vehículo estacionado (sin culpa)" },
  { palabras: ["exceso de velocidad", "muy rápido", "alta velocidad"], articulo: "48", culpa: 80, descripcion: "Exceso de velocidad" },
  { palabras: ["semáforo en rojo", "semaforo en rojo", "luz roja"], articulo: "50", culpa: 100, descripcion: "Cruzar semáforo en rojo" },
  { palabras: ["no lo vi", "no lo ví", "no miré", "no mire", "distracción"], articulo: "50", culpa: 70, descripcion: "Falta de atención" },
  { palabras: ["choqué", "choque", "impacté", "impacte", "embestí", "embesti", "colisioné", "colisione"], articulo: "42", culpa: 60, descripcion: "Colisión activa" },
];

// Función de análisis local
const analizarLocal = (declaracion, numeroSiniestro) => {
  const texto = declaracion.toLowerCase();
  
  // Detectar infracciones
  let infraccionesDetectadas = [];
  let culpaTotal = 0;
  let articulosViolados = [];

  PATRONES_CULPA.forEach(patron => {
    patron.palabras.forEach(palabra => {
      if (texto.includes(palabra) && !infraccionesDetectadas.includes(patron.descripcion)) {
        infraccionesDetectadas.push(patron.descripcion);
        articulosViolados.push(`Art. ${patron.articulo}`);
        culpaTotal = Math.max(culpaTotal, patron.culpa);
      }
    });
  });

  // Si menciona marcha atrás y vehículo estacionado = culpa del que hacía marcha atrás
  const haciaAtras = texto.includes("marcha atr") || texto.includes("retrocedi");
  const vehiculoEstacionado = texto.includes("estacionado") || texto.includes("detenido");

  let conductorA = {
    identificacion: "Asegurado (declarante)",
    porcentaje_culpa: haciaAtras ? 100 : (culpaTotal > 0 ? culpaTotal : 50),
    infracciones: haciaAtras ? ["Maniobra de marcha atrás sin precaución adecuada"] : infraccionesDetectadas,
    articulos_violados: haciaAtras ? ["Art. 43 - Marcha atrás"] : articulosViolados
  };

  let conductorB = {
    identificacion: "Tercero",
    porcentaje_culpa: vehiculoEstacionado ? 0 : (100 - conductorA.porcentaje_culpa),
    infracciones: vehiculoEstacionado ? [] : ["Posible contribución al siniestro"],
    articulos_violados: []
  };

  // Caso específico: marcha atrás contra estacionado
  if (haciaAtras && vehiculoEstacionado) {
    conductorA.porcentaje_culpa = 100;
    conductorA.infracciones = ["Realizó marcha atrás sin verificar que no hubiera obstáculos"];
    conductorA.articulos_violados = ["Art. 43 - Marcha atrás: debe asegurarse de no embestir"];
    conductorB.porcentaje_culpa = 0;
    conductorB.infracciones = [];
    conductorB.identificacion = "Tercero (vehículo estacionado)";
  }

  // Generar conclusión
  let conclusion = "";
  let recomendacion = "";

  if (conductorA.porcentaje_culpa === 100) {
    conclusion = `El asegurado es 100% responsable del siniestro. ${conductorA.infracciones[0]}. El tercero no tiene responsabilidad ya que su vehículo se encontraba correctamente estacionado.`;
    recomendacion = "APROBADO para pago al tercero";
  } else if (conductorA.porcentaje_culpa >= 70) {
    conclusion = `El asegurado tiene responsabilidad mayoritaria (${conductorA.porcentaje_culpa}%) en el siniestro por ${conductorA.infracciones[0]?.toLowerCase() || 'las infracciones detectadas'}.`;
    recomendacion = "APROBADO para pago proporcional";
  } else if (conductorA.porcentaje_culpa >= 50) {
    conclusion = `Responsabilidad compartida. Ambos conductores contribuyeron al siniestro.`;
    recomendacion = "REQUIERE MÁS INFORMACIÓN";
  } else {
    conclusion = `El tercero tiene mayor responsabilidad en el siniestro.`;
    recomendacion = "RECHAZADO - Reclamar al tercero";
  }

  return {
    conductor_a: conductorA,
    conductor_b: conductorB,
    conclusion: conclusion,
    recomendacion: recomendacion
  };
};

export default function DictamenIA({ siniestro, onVolver }) {
  const [declaracion, setDeclaracion] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [dictamen, setDictamen] = useState(null);
  const [error, setError] = useState(null);

  const analizarDeclaracion = async () => {
    if (!declaracion.trim()) {
      setError("Ingresá la declaración del siniestro para analizar.");
      return;
    }

    setAnalizando(true);
    setError(null);
    setDictamen(null);

    // Simular tiempo de análisis
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const resultado = analizarLocal(declaracion, siniestro?.numero);
      setDictamen(resultado);
    } catch (err) {
      console.error("Error al analizar:", err);
      setError(`Error al analizar: ${err.message}`);
    } finally {
      setAnalizando(false);
    }
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
        gap: "16px"
      }}>
        <button
          onClick={onVolver}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            cursor: "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          ← Volver
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
            ⚖️ Dictamen de Culpabilidad
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Siniestro #{siniestro?.numero || "N/D"} - {siniestro?.cia || "INTEGRITY"}
          </p>
        </div>
      </header>

      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: dictamen ? "1fr 1fr" : "1fr", gap: "24px" }}>
          {/* Panel de entrada */}
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "24px"
          }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>
              Declaración del Siniestro
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
              Pegá la declaración de las partes involucradas. El sistema analizará según la Ley de Tránsito Argentina.
            </p>
            
            <textarea
              value={declaracion}
              onChange={(e) => setDeclaracion(e.target.value)}
              placeholder="Ejemplo: El día 15/03/2026 a las 14:30hs, circulaba por Av. Colón en dirección norte cuando al llegar a la intersección con calle San Juan..."
              style={{
                width: "100%",
                minHeight: "300px",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                lineHeight: "1.6",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box"
              }}
            />

            {error && (
              <div style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: "#fef2f2",
                borderRadius: "8px",
                color: "#dc2626",
                fontSize: "14px"
              }}>
                {error}
              </div>
            )}

            <button
              onClick={analizarDeclaracion}
              disabled={analizando}
              style={{
                marginTop: "16px",
                width: "100%",
                padding: "14px 20px",
                borderRadius: "10px",
                border: "none",
                background: analizando 
                  ? "#94a3b8" 
                  : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "600",
                cursor: analizando ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {analizando ? (
                <>⏳ Analizando...</>
              ) : (
                <>⚖️ Analizar Culpabilidad</>
              )}
            </button>

            {/* Info de normativa */}
            <div style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px"
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                📚 Normativa aplicada
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(ARTICULOS).map(([num, desc]) => (
                  <div key={num} style={{ fontSize: "12px", color: "#64748b" }}>
                    <strong style={{ color: "#475569" }}>Art. {num}:</strong> {desc}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de resultado */}
          {dictamen && (
            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "24px"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginBottom: "20px"
              }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>
                  📋 Resultado del Dictamen
                </h2>
                <span style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  backgroundColor: dictamen.recomendacion?.includes("APROBADO") 
                    ? "#dcfce7" 
                    : dictamen.recomendacion?.includes("RECHAZADO")
                      ? "#fef2f2"
                      : "#fef9c3",
                  color: dictamen.recomendacion?.includes("APROBADO") 
                    ? "#16a34a" 
                    : dictamen.recomendacion?.includes("RECHAZADO")
                      ? "#dc2626"
                      : "#ca8a04"
                }}>
                  {dictamen.recomendacion}
                </span>
              </div>

              {/* Conductor A - Asegurado */}
              <div style={{
                padding: "16px",
                backgroundColor: dictamen.conductor_a?.porcentaje_culpa > 50 ? "#fef2f2" : "#f0fdf4",
                borderRadius: "10px",
                marginBottom: "12px",
                border: `1px solid ${dictamen.conductor_a?.porcentaje_culpa > 50 ? "#fecaca" : "#bbf7d0"}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                    🚗 Asegurado
                  </h3>
                  <span style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: dictamen.conductor_a?.porcentaje_culpa > 50 ? "#dc2626" : "#16a34a"
                  }}>
                    {dictamen.conductor_a?.porcentaje_culpa || 0}%
                  </span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#475569" }}>
                  {dictamen.conductor_a?.identificacion}
                </p>
                {dictamen.conductor_a?.infracciones?.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>
                      INFRACCIONES DETECTADAS:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#475569" }}>
                      {dictamen.conductor_a.infracciones.map((inf, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>{inf}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {dictamen.conductor_a?.articulos_violados?.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>
                      ARTÍCULOS APLICABLES:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {dictamen.conductor_a.articulos_violados.map((art, i) => (
                        <span key={i} style={{
                          padding: "4px 10px",
                          backgroundColor: "#ffffff",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#7c3aed",
                          fontWeight: "500",
                          border: "1px solid #e9d5ff"
                        }}>
                          {art}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Conductor B - Tercero */}
              <div style={{
                padding: "16px",
                backgroundColor: dictamen.conductor_b?.porcentaje_culpa > 50 ? "#fef2f2" : "#f0fdf4",
                borderRadius: "10px",
                marginBottom: "16px",
                border: `1px solid ${dictamen.conductor_b?.porcentaje_culpa > 50 ? "#fecaca" : "#bbf7d0"}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                    🚙 Tercero
                  </h3>
                  <span style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: dictamen.conductor_b?.porcentaje_culpa > 50 ? "#dc2626" : "#16a34a"
                  }}>
                    {dictamen.conductor_b?.porcentaje_culpa || 0}%
                  </span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#475569" }}>
                  {dictamen.conductor_b?.identificacion}
                </p>
                {dictamen.conductor_b?.infracciones?.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Observaciones:</div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#475569" }}>
                      {dictamen.conductor_b.infracciones.map((inf, i) => (
                        <li key={i}>{inf}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Conclusión */}
              <div style={{
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "10px",
                marginBottom: "20px",
                border: "1px solid #e2e8f0"
              }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                  📝 Conclusión
                </h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                  {dictamen.conclusion}
                </p>
              </div>

              {/* Botones de acción */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    alert(`✅ Dictamen aprobado para siniestro #${siniestro?.numero}\n\nAsegurado: ${dictamen.conductor_a?.porcentaje_culpa}% culpa\nTercero: ${dictamen.conductor_b?.porcentaje_culpa}% culpa\n\n${dictamen.recomendacion}`);
                    onVolver();
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#22c55e",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  ✓ Aprobar Dictamen
                </button>
                <button
                  onClick={() => setDictamen(null)}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  ✎ Volver a Analizar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
