import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Registro from './components/Registro';
import Reportes from './components/Reportes';
import NuevoReporte from './components/NuevoReporte';
import ModalReporte from './components/ModalReporte';
import RegistroMascota from './components/RegistroMascota';
import Perfil from './components/Perfil';
import MisMascotas from './components/MisMascotas';
import BannerNotif from './components/Notificaciones/BannerNotif';
import { AppProvider } from './context/AppContext';
import { useSocket } from './hooks/useSocket';
import './App.css';

function SocketInitializer() {
  useSocket();
  return null;
}

function ModalReporteRoute() {
  const navigate = useNavigate();
  const { encodedId } = useParams();
  return <ModalReporte open={true} onClose={() => navigate(-1)} encodedId={encodedId} />;
}

function ModalRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  const backgroundLocation = state && state.backgroundLocation;

  return (
    <>
      <Navbar />
      <BannerNotif />
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Home />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/mis-mascotas" element={<MisMascotas />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/reportes" element={<Reportes open={true} onClose={() => navigate(-1)} />} />
          <Route path="/nuevo-reporte" element={<NuevoReporte open={true} onClose={() => navigate('/')} />} />
          <Route path="/registromascota" element={<RegistroMascota open={true} onClose={() => navigate(-1)} />} />
          <Route path="/modalreporte/:encodedId" element={<ModalReporteRoute />} />
        </Routes>
      )}
      <Footer />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <SocketInitializer />
      <Router>
        <ModalRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
