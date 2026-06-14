import { useState } from "react";
import { useLocation } from "react-router-dom";
import ReportarPerdida from "./ReportarPerdida";
import ReportarEncontrada from "./ReportarEncontrada";
import "../css/NuevoReporte.css";

const OPCIONES = [
  {
    id: "perdida",
    emoji: "😢",
    titulo: "Mi mascota se perdio",
    desc: "Activa la busqueda y encuentra posibles coincidencias",
  },
  {
    id: "encontrada",
    emoji: "🔍",
    titulo: "Encontre una mascota",
    desc: "Ayuda a reunirla con su dueno",
  },
];

const TITULOS = {
  perdida:    "😢 Reportar perdida",
  encontrada: "🔍 Reportar mascota encontrada",
};

export default function NuevoReporte({ open, onClose }) {
  const location = useLocation();
  const [flujo, setFlujo] = useState(location.state?.flujoInicial || null);
  const [exito, setExito] = useState("");

  if (!open) return null;

  const cerrar = () => {
    setFlujo(null);
    setExito("");
    onClose();
  };

  const handleExito = (msg) => {
    setExito(msg);
    setTimeout(cerrar, 2500);
  };

  return (
    <div className="nr-overlay" onClick={cerrar}>
      <div className="nr-modal" onClick={e => e.stopPropagation()}>
        <div className="nr-modal-header">
          <h2>{flujo ? TITULOS[flujo] : "Que quieres reportar?"}</h2>
          <button className="nr-close" onClick={cerrar} aria-label="Cerrar">x</button>
        </div>

        {exito ? (
          <div style={{ padding: "40px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #2d8a4e 0%, #3aad65 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(45,138,78,0.35)",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p style={{ color: "#1a6635", fontWeight: 700, fontSize: "1.1rem", margin: "0 0 6px" }}>{exito}</p>
              <p style={{ color: "#888", fontSize: "0.82rem", margin: 0 }}>Cerrando en unos segundos…</p>
            </div>
          </div>
        ) : !flujo ? (
          <div className="nr-selector">
            {OPCIONES.map(op => (
              <button key={op.id} className="nr-opcion" onClick={() => setFlujo(op.id)}>
                <span className="nr-opcion-emoji">{op.emoji}</span>
                <div className="nr-opcion-texto">
                  <span className="nr-opcion-titulo">{op.titulo}</span>
                  <span className="nr-opcion-desc">{op.desc}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <>
            {flujo === "perdida"    && <ReportarPerdida    onClose={cerrar} onExito={handleExito} />}
            {flujo === "encontrada" && <ReportarEncontrada onClose={cerrar} onExito={handleExito} />}
          </>
        )}
      </div>
    </div>
  );
}
