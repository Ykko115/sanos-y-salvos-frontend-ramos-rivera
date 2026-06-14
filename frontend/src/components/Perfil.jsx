import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Perfil.css';

export default function Perfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        if (usuario.exp && Date.now() / 1000 > usuario.exp) {
          localStorage.removeItem('usuario');
          navigate('/');
        } else {
          setUser(usuario);
          setEditData({
            nombre: usuario.user?.nombre || '',
            apellido: usuario.user?.apellido || '',
            email: usuario.user?.email || '',
          });
        }
      } catch {
        navigate('/');
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [navigate]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSaveChanges = async () => {
    if (!editData.nombre.trim() || !editData.apellido.trim()) {
      setError('El nombre y apellido son requeridos');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:8080/api/usuarios/${user.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          nombre: editData.nombre.trim(),
          apellido: editData.apellido.trim(),
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar cambios');
      }

      const usuarioActualizado = await response.json();
      const nuevoUsuario = {
        ...user,
        user: {
          ...user.user,
          nombre: usuarioActualizado.nombre,
          apellido: usuarioActualizado.apellido
        }
      };
      
      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
      setUser(nuevoUsuario);
      setEditMode(false);
      setSuccess('Perfil actualizado exitosamente');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!user) {
    return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Debes iniciar sesión</div>;
  }

  const nombreCompleto = user.user?.nombre && user.user?.apellido 
    ? `${user.user.nombre} ${user.user.apellido}` 
    : user.user?.email;

  return (
    <main className="perfil-container">
      <div className="container">
        <div className="perfil-header">
          <div className="perfil-avatar">
            <span>👤</span>
          </div>
          <div className="perfil-title">
            <h2>{nombreCompleto}</h2>
            <p className="perfil-rol">Usuario</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="perfil-content">
          {!editMode ? (
            <div className="perfil-info">
              <div className="info-card">
                <div className="info-field">
                  <label>📧 Email</label>
                  <p>{user.user?.email || 'N/A'}</p>
                </div>
                <div className="info-field">
                  <label>👤 Nombre</label>
                  <p>{user.user?.nombre || 'N/A'}</p>
                </div>
                <div className="info-field">
                  <label>👥 Apellido</label>
                  <p>{user.user?.apellido || 'N/A'}</p>
                </div>
              </div>
              <button className="btn-edit" onClick={() => setEditMode(true)}>
                ✏️ Editar Perfil
              </button>
            </div>
          ) : (
            <div className="perfil-edit">
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="nombre">👤 Nombre</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={editData.nombre}
                    onChange={handleEditChange}
                    placeholder="Tu nombre"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="apellido">👥 Apellido</label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={editData.apellido}
                    onChange={handleEditChange}
                    placeholder="Tu apellido"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">📧 Email (no editable)</label>
                  <input
                    type="email"
                    id="email"
                    value={editData.email}
                    disabled
                    className="form-input disabled"
                  />
                </div>

                <div className="edit-buttons">
                  <button 
                    className="btn-save" 
                    onClick={handleSaveChanges}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : '✓ Guardar Cambios'}
                  </button>
                  <button 
                    className="btn-cancel" 
                    onClick={() => {
                      setEditMode(false);
                      setError('');
                      setEditData({
                        nombre: user.user?.nombre || '',
                        apellido: user.user?.apellido || '',
                        email: user.user?.email || '',
                      });
                    }}
                    disabled={saving}
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
