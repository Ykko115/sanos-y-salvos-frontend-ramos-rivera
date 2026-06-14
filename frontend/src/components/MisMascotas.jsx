import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/MisMascotas.css';
import EditarMascota from './EditarMascota';

export default function MisMascotas() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMascotas, setLoadingMascotas] = useState(false);
  const [error, setError] = useState('');
  const [editingMascota, setEditingMascota] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Verificar si el usuario está logueado
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        // Verificar expiración del token
        if (usuario.exp && Date.now() / 1000 > usuario.exp) {
          localStorage.removeItem('usuario');
          navigate('/');
        } else {
          setUser(usuario);
        }
      } catch {
        navigate('/');
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [navigate]);

  // Cargar mascotas del usuario
  useEffect(() => {
    if (user && user.user && user.user.id) {
      cargarMascotas();
    }
  }, [user]);

  const cargarMascotas = async () => {
    setLoadingMascotas(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:8080/api/mascotas/usuario/${user.user.id}`);
      if (!response.ok) {
        throw new Error('Error al cargar las mascotas');
      }
      const datos = await response.json();
      setMascotas(Array.isArray(datos) ? datos : []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar las mascotas');
      setMascotas([]);
    } finally {
      setLoadingMascotas(false);
    }
  };

  const handleDeleteMascota = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta mascota?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`http://localhost:8080/api/mascotas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la mascota');
      }

      setMascotas(mascotas.filter(m => m.id !== id));
    } catch (err) {
      setError('Error al eliminar la mascota');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingMascota(null);
    cargarMascotas();
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        Debes iniciar sesión para ver tus mascotas
      </div>
    );
  }

  const nombreCompleto = user.user.nombre && user.user.apellido 
    ? `${user.user.nombre} ${user.user.apellido}` 
    : user.user.nombre || user.user.email;

  return (
    <main className="mis-mascotas-container">
      <div className="container">
        <div className="mis-mascotas-header">
          <h2>🐾 Mis Mascotas</h2>
          <p>Bienvenido, <strong>{nombreCompleto}</strong></p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {loadingMascotas ? (
          <div className="loading-container">
            <p>Cargando tus mascotas...</p>
          </div>
        ) : mascotas.length === 0 ? (
          <div className="no-mascotas">
            <p>Aún no has registrado ninguna mascota.</p>
            <button className="btn-registrar" onClick={() => navigate('/', { state: { backgroundLocation: window.location } })}>
              📝 Registrar mi primera mascota
            </button>
          </div>
        ) : (
          <div className="mascotas-grid">
            {mascotas.map((mascota) => (
              <div key={mascota.id} className="mascota-card">
                <div className="mascota-header">
                  <h3>{mascota.nombre}</h3>
                  <span className={`badge badge-${mascota.estado.toLowerCase()}`}>
                    {mascota.estado}
                  </span>
                </div>

                <div className="mascota-info">
                  <p>
                    <strong>Especie:</strong> {mascota.especie}
                  </p>
                  <p>
                    <strong>Raza:</strong> {mascota.raza}
                  </p>
                  <p>
                    <strong>Edad:</strong> {mascota.edad} {mascota.edad === 1 ? 'año' : 'años'}
                  </p>
                  <p>
                    <strong>Descripción:</strong> {mascota.descripcion}
                  </p>
                  {mascota.fechaRegistro && (
                    <p className="fecha-registro">
                      Registrado: {new Date(mascota.fechaRegistro).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>

                <div className="mascota-actions">
                  <button 
                    className="btn-action btn-edit"
                    onClick={() => setEditingMascota(mascota)}
                    title="Editar mascota"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn-action btn-delete"
                    onClick={() => handleDeleteMascota(mascota.id)}
                    disabled={deletingId === mascota.id}
                    title="Eliminar mascota"
                  >
                    {deletingId === mascota.id ? '⏳ Eliminando...' : '🗑️ Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingMascota && (
        <EditarMascota 
          mascota={editingMascota}
          usuario={user}
          onClose={() => setEditingMascota(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </main>
  );
}
