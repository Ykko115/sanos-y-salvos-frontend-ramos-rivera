
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Registro from './components/Registro';
import Reportes from './components/Reportes';
import ModalReporte from './components/ModalReporte';
import './App.css';


function ModalReporteRoute() {
  const navigate = useNavigate();
  const { encodedId } = useParams();

  return <ModalReporte open={true} onClose={() => navigate(-1)} encodedId={encodedId} />;
}



function ModalRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  // Detecta si la navegación es modal
  const state = location.state;
  const backgroundLocation = state && state.backgroundLocation;

  return (
    <>
      <Navbar />
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Home />} />
      </Routes>

      {/* Modales sobre Home */}
      {backgroundLocation && (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/reportes" element={<Reportes open={true} onClose={() => navigate(-1)} />} />
          <Route path="/modalreporte/:encodedId" element={<ModalReporteRoute />} />
        </Routes>
      )}
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <ModalRoutes />
    </Router>
  );
}

export default App;
