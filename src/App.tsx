import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { SolicitudesList } from './components/solicitudes/SolicitudesList';
import { SolicitudFormModal } from './components/solicitudes/SolicitudFormModal';
import { AsignacionModal } from './components/solicitudes/AsignacionModal';
import { AsesoriasList } from './components/asesorias/AsesoriasList';
import { FichaAsesoriaModal } from './components/asesorias/FichaAsesoriaModal';
import { SeguimientoModal } from './components/asesorias/SeguimientoModal';
import { CalendarView } from './components/calendario/CalendarView';
import { DisponibilidadView } from './components/disponibilidad/DisponibilidadView';
import { UsuariosView } from './components/admin/UsuariosView';
import { CatalogosView, CatalogoTipo } from './components/admin/CatalogosView';
import { ReportesView } from './components/admin/ReportesView';
import { AuditoriaView } from './components/admin/AuditoriaView';
import { ConfiguracionView } from './components/admin/ConfiguracionView';
import { ProfileView } from './components/profile/ProfileView';
import { LoginView } from './components/auth/LoginView';
import { SIAADataService } from './services/siaaService';
import { Asesoria } from './types/siaa';

function SIAAApp() {
  const { currentUser, currentRole } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [selectedAdvisoryId, setSelectedAdvisoryId] = useState<string | null>(null);
  const [isNewSolicitudModalOpen, setIsNewSolicitudModalOpen] = useState(false);
  const [advisoryToAssign, setAdvisoryToAssign] = useState<Asesoria | null>(null);
  const [advisoryToFollowUp, setAdvisoryToFollowUp] = useState<Asesoria | null>(null);

  // Re-fetch advisory when needed
  const selectedAdvisory = selectedAdvisoryId
    ? SIAADataService.getAsesoriaById(selectedAdvisoryId)
    : null;

  if (!currentUser) {
    return <LoginView />;
  }

  const handleNavigate = (view: NavView) => {
    if (view === 'solicitar') {
      setIsNewSolicitudModalOpen(true);
      return;
    }
    setCurrentView(view);
  };

  const handleSelectAdvisory = (id: string) => {
    setSelectedAdvisoryId(id);
  };

  const handleNewSolicitudSuccess = (newId: string) => {
    setSelectedAdvisoryId(newId);
    setCurrentView('solicitudes');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Institutional Top Navigation Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigateToNotifications={() => setCurrentView('solicitudes')}
        onSelectAdvisory={handleSelectAdvisory}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Responsive Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Body */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* Dynamic view rendering */}
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onSelectAdvisory={handleSelectAdvisory}
              onOpenSolicitudModal={() => setIsNewSolicitudModalOpen(true)}
            />
          )}

          {currentView === 'solicitudes' && (
            <SolicitudesList
              onSelectAdvisory={handleSelectAdvisory}
              onOpenNewModal={() => setIsNewSolicitudModalOpen(true)}
              onOpenAssignModal={(a) => setAdvisoryToAssign(a)}
            />
          )}

          {currentView === 'asesorias' && (
            <AsesoriasList
              onSelectAdvisory={handleSelectAdvisory}
              onOpenSeguimiento={(a) => setAdvisoryToFollowUp(a)}
              isHistoryView={false}
            />
          )}

          {currentView === 'historial' && (
            <AsesoriasList
              onSelectAdvisory={handleSelectAdvisory}
              onOpenSeguimiento={(a) => setAdvisoryToFollowUp(a)}
              isHistoryView={true}
            />
          )}

          {currentView === 'seguimiento' && (
            <AsesoriasList
              onSelectAdvisory={handleSelectAdvisory}
              onOpenSeguimiento={(a) => setAdvisoryToFollowUp(a)}
              isHistoryView={false}
            />
          )}

          {currentView === 'calendario' && (
            <CalendarView onSelectAdvisory={handleSelectAdvisory} />
          )}

          {currentView === 'disponibilidad' && (
            <DisponibilidadView />
          )}

          {currentView === 'usuarios' && (
            <UsuariosView />
          )}

          {(currentView === 'carreras' ||
            currentView === 'materias' ||
            currentView === 'grupos' ||
            currentView === 'cuatrimestres' ||
            currentView === 'aulas') && (
            <CatalogosView initialType={currentView as CatalogoTipo} />
          )}

          {currentView === 'reportes' && (
            <ReportesView />
          )}

          {currentView === 'auditoria' && (
            <AuditoriaView />
          )}

          {currentView === 'configuracion' && (
            <ConfiguracionView />
          )}

          {currentView === 'perfil' && (
            <ProfileView />
          )}
        </main>
      </div>

      {/* Global Modals */}

      {/* 1. Ficha Oficial de Asesoría */}
      <FichaAsesoriaModal
        isOpen={!!selectedAdvisoryId}
        onClose={() => setSelectedAdvisoryId(null)}
        asesoria={selectedAdvisory || null}
        onOpenSeguimiento={(a) => setAdvisoryToFollowUp(a)}
      />

      {/* 2. Nueva Solicitud de Asesoría Form */}
      <SolicitudFormModal
        isOpen={isNewSolicitudModalOpen}
        onClose={() => setIsNewSolicitudModalOpen(false)}
        onSuccess={handleNewSolicitudSuccess}
      />

      {/* 3. Modal de Asignación de Horario / Docente / Aula */}
      <AsignacionModal
        isOpen={!!advisoryToAssign}
        onClose={() => setAdvisoryToAssign(null)}
        asesoria={advisoryToAssign}
        onSuccess={() => {
          setAdvisoryToAssign(null);
        }}
      />

      {/* 4. Modal de Registro de Seguimiento */}
      <SeguimientoModal
        isOpen={!!advisoryToFollowUp}
        onClose={() => setAdvisoryToFollowUp(null)}
        asesoria={advisoryToFollowUp}
        onSuccess={() => {
          setAdvisoryToFollowUp(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SIAAApp />
    </AuthProvider>
  );
}
