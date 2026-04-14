import { useState } from "react";

// Ley de Tránsito Argentina - Artículos relevantes para dictamen
const LEY_TRANSITO = `
LEY NACIONAL DE TRÁNSITO 24.449 - ARTÍCULOS RELEVANTES PARA DICTAMEN DE CULPABILIDAD

Art. 39 - PRIORIDADES:
a) En las bocacalles tiene prioridad de paso el vehículo que circula por la derecha.
b) Excepción a la prioridad: 
   - Los peatones que cruzan lícitamente la calzada
   - Los vehículos ferroviarios
   - Los vehículos del servicio público de urgencia
   - Los vehículos que circulan por una semiautopista
c) Antes de ingresar a una arteria de mayor jerarquía debe detenerse.
d) Los que descienden tienen prioridad sobre los que ascienden.

Art. 40 - GIROS Y ROTONDAS:
a) Advertir con luz de giro con antelación no menor a 30m.
b) Circular pegado al cordón derecho para doblar a la derecha.
c) Circular pegado al eje central para doblar a la izquierda.
d) En rotondas, la circulación es en sentido contrario a las agujas del reloj.
e) Prioridad de quien está adentro de la rotonda.

Art. 41 - ADELANTAMIENTO:
a) Solo por la izquierda, excepto que el vehículo adelantado indique giro a la izquierda.
b) Prohibido en curvas, puentes, túneles y cruces ferroviarios.
c) El vehículo adelantado debe facilitar la maniobra.

Art. 42 - VARIACIONES DE VELOCIDAD:
a) Prohibido variar bruscamente la velocidad.
b) El conductor que desee disminuir debe advertirlo previamente.

Art. 43 - MARCHA ATRÁS:
a) Limitada a maniobras complementarias.
b) Debe asegurarse de no embestir a ningún peatón o vehículo.

Art. 48 - VELOCIDAD MÁXIMA:
a) Zona urbana: 40 km/h en calles, 60 km/h en avenidas.
b) Zona rural: 110 km/h para autos, 80 km/h para camiones.
c) Zona semiurbana: 60 km/h.

Art. 50 - PROHIBICIONES:
a) Conducir con impedimentos físicos o psíquicos.
b) Conducir en estado de intoxicación alcohólica o bajo efectos de estupefacientes.
c) Conducir sin habilitación.
d) Usar auriculares conectados a aparatos de audio.

CRITERIOS DE CULPABILIDAD:
- 100% culpable: Violación clara de norma específica (no ceder paso, semáforo en rojo, exceso velocidad probado)
- 70-30: Infracción principal de uno con contribución menor del otro
- 50-50: Ambos conductores con infracciones similares
- 0%: Sin responsabilidad (caso fortuito, fuerza mayor, víctima de maniobra imprevista)
`;

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

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Sos un perito de siniestros de tránsito en Argentina. Analizá esta declaración y emití un dictamen de culpabilidad basándote en la Ley Nacional de Tránsito 24.449.

SINIESTRO: #${siniestro?.numero || "N/D"}
COMPAÑÍA: ${siniestro?.cia || "INTEGRITY"}

DECLARACIÓN DEL SINIESTRO:
${declaracion}

NORMATIVA APLICABLE:
${LEY_TRANSITO}

Respondé en formato JSON con esta estructura exacta:
{
  "conductor_a": {
    "identificacion": "descripción breve del conductor A",
    "porcentaje_culpa": número entre 0 y 100,
    "infracciones": ["lista de infracciones cometidas"],
    "articulos_violados": ["Art. XX - descripción"]
  },
  "conductor_b": {
    "identificacion": "descripción breve del conductor B",
    "porcentaje_culpa": número entre 0 y 100,
    "infracciones": ["lista de infracciones cometidas"],
    "articulos_violados": ["Art. XX - descripción"]
  },
  "conclusion": "Resumen del dictamen en 2-3 oraciones",
  "recomendacion": "APROBADO para pago" o "RECHAZADO" o "REQUIERE MÁS INFORMACIÓN"
}

Solo respondé con el JSON, sin texto adicional ni markdown.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Error de API: ${response.status}`);
      }

      const data = await response.json();
      const textoRespuesta = data.content
        .map(item => item.text || "")
        .join("");

      // Parsear JSON de la respuesta
      const jsonMatch = textoRespuesta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const resultado = JSON.parse(jsonMatch[0]);
        setDictamen(resultado);
      } else {
        throw new Error("No se pudo parsear la respuesta del análisis");
      }

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
            ⚖️ Dictamen de Culpabilidad IA
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
              Pegá la declaración de las partes involucradas. El agente analizará según la Ley de Tránsito Argentina.
            </p>
            
            <textarea
              value={declaracion}
              onChange={(e) => setDeclaracion(e.target.value)}
              placeholder="Ejemplo: El día 15/03/2026 a las 14:30hs, circulaba por Av. Colón en dirección norte cuando al llegar a la intersección con calle San Juan, el vehículo del tercero que venía por mi derecha impactó mi lateral izquierdo. El semáforo estaba en verde para mí..."
              style={{
                width: "100%",
                minHeight: "300px",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                lineHeight: "1.6",
                resize: "vertical",
                fontFamily: "inherit"
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
                <>
                  <span style={{ 
                    display: "inline-block", 
                    animation: "spin 1s linear infinite",
                    fontSize: "16px"
                  }}>⏳</span>
                  Analizando...
                </>
              ) : (
                <>⚖️ Analizar con IA</>
              )}
            </button>

            {/* Info de normativa */}
            <div style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px"
            }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                📚 Normativa aplicada
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                Ley Nacional de Tránsito 24.449: Art. 39 (Prioridades), Art. 40 (Giros), 
                Art. 41 (Adelantamiento), Art. 42 (Velocidad), Art. 48 (Límites), Art. 50 (Prohibiciones)
              </p>
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

              {/* Conductor A */}
              <div style={{
                padding: "16px",
                backgroundColor: "#fef2f2",
                borderRadius: "10px",
                marginBottom: "12px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#dc2626" }}>
                    🚗 Conductor A
                  </h3>
                  <span style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#dc2626"
                  }}>
                    {dictamen.conductor_a?.porcentaje_culpa || 0}%
                  </span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#475569" }}>
                  {dictamen.conductor_a?.identificacion}
                </p>
                {dictamen.conductor_a?.infracciones?.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Infracciones:</div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#475569" }}>
                      {dictamen.conductor_a.infracciones.map((inf, i) => (
                        <li key={i}>{inf}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {dictamen.conductor_a?.articulos_violados?.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Artículos violados:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {dictamen.conductor_a.articulos_violados.map((art, i) => (
                        <span key={i} style={{
                          padding: "2px 8px",
                          backgroundColor: "#ffffff",
                          borderRadius: "4px",
                          fontSize: "11px",
                          color: "#dc2626"
                        }}>
                          {art}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Conductor B */}
              <div style={{
                padding: "16px",
                backgroundColor: "#eff6ff",
                borderRadius: "10px",
                marginBottom: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#2563eb" }}>
                    🚙 Conductor B
                  </h3>
                  <span style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#2563eb"
                  }}>
                    {dictamen.conductor_b?.porcentaje_culpa || 0}%
                  </span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#475569" }}>
                  {dictamen.conductor_b?.identificacion}
                </p>
                {dictamen.conductor_b?.infracciones?.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Infracciones:</div>
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
                marginBottom: "20px"
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
                    alert("✅ Dictamen aprobado y guardado");
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
                  ✓ Aprobar
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
                  ✎ Modificar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
