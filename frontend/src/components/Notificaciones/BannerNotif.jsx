import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import '../../css/BannerNotif.css';

const COLORES = {
  nueva_coincidencia: { bg: '#ecfdf5', border: '#2d8a4e', icono: '🐾' },
  nuevo_reporte:      { bg: '#eff6ff', border: '#3b82f6', icono: '📋' },
  mascota_reunida:    { bg: '#ecfdf5', border: '#2d8a4e', icono: '✅' },
  alerta_refugio:     { bg: '#fff8e1', border: '#f59e0b', icono: '⚠️' },
};

function Banner({ notif, onClose }) {
  const estilo = COLORES[notif.tipo] || COLORES.nuevo_reporte;

  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="banner-notif"
      style={{ background: estilo.bg, borderLeftColor: estilo.border }}
    >
      <span className="banner-icono">{estilo.icono}</span>
      <div className="banner-texto">
        <strong>{notif.titulo}</strong>
        <span>{notif.mensaje}</span>
      </div>
      <button className="banner-cerrar" onClick={onClose} aria-label="Cerrar">×</button>
    </div>
  );
}

export default function BannerNotif() {
  const { state } = useAppContext();
  const [visibles, setVisibles] = useState([]);
  const [yaVistos, setYaVistos] = useState(new Set());

  useEffect(() => {
    if (!state.notificaciones.length) return;
    const ultima = state.notificaciones[0];
    if (yaVistos.has(ultima.id)) return;
    setYaVistos((prev) => new Set([...prev, ultima.id]));
    setVisibles((prev) => [ultima, ...prev].slice(0, 3));
  }, [state.notificaciones, yaVistos]);

  const cerrar = (id) => setVisibles((prev) => prev.filter((n) => n.id !== id));

  if (!visibles.length) return null;

  return (
    <div className="banner-container">
      {visibles.map((n) => (
        <Banner key={n.id} notif={n} onClose={() => cerrar(n.id)} />
      ))}
    </div>
  );
}
