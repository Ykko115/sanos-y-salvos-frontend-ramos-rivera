import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './Home';
import Login from './usuarios/Login';
import Registro from './usuarios/Registro';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home');

  const handleLoginClick = () => {
    setCurrentView('login');
  };

  const handleRegisterClick = () => {
    setCurrentView('registro');
  };

  const handleCloseModal = () => {
    setCurrentView('home');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  const handleSwitchToRegister = () => {
    setCurrentView('registro');
  };

  return (
    <>
      <Navbar onLogin={handleLoginClick} onRegister={handleRegisterClick} />

      {currentView === 'home' && (
        <Home onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
      )}

      {currentView === 'login' && (
        <Login onClose={handleCloseModal} onSwitchToRegister={handleSwitchToRegister} />
      )}

      {currentView === 'registro' && (
        <Registro onClose={handleCloseModal} onSwitchToLogin={handleSwitchToLogin} />
      )}

      <Footer />
    </>
  );
}

export default App;
