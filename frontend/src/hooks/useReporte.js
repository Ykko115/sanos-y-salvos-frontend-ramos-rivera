import { useState, useEffect } from 'react';

export function useReporte(filtro = 'todo', zona = 'todas') {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    fetch(`/api/reportes/resumen?periodo=${filtro}&zona=${zona}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setData(d); setCargando(false); })
      .catch(() => setCargando(false));
  }, [filtro, zona]);

  const exportar = (formato) => {
    const url = `/api/reportes/exportar?formato=${formato}&periodo=${filtro}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `reporte-sanos-salvos.${formato}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return { data, cargando, exportar };
}
