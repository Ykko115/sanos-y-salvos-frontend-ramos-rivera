import { useState } from "react";
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
  const [flujo, setFlujo] = useState(null);
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
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>OK</div>
            <p style={{ color: "#2d8a4e", fontWeight: 700, fontSize: "1rem" }}>{exito}</p>
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
