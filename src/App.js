import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SaasTemplateNew from './components/ui/SaasTemplateNew';
import LoginPage from './pages/Login';
import NoticiasImportantes from './pages/NoticiasImportantes';
import LocalAnalysis from './pages/LocalAnalysis';
import AnaliseFutura from './pages/AnaliseFutura';
import CalculadoraCacau from './pages/CalculadoraCacau';
import ImportAnalysis from './pages/ImportAnalysis';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<SaasTemplateNew />} />
          <Route path="/noticias" element={<NoticiasImportantes />} />
          <Route path="/analise-local" element={<LocalAnalysis />} />
          <Route path="/analise-futura" element={<AnaliseFutura />} />
          <Route path="/calculadora" element={<CalculadoraCacau />} />
          <Route path="/import-analysis" element={<ImportAnalysis />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
