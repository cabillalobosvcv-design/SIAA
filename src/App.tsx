import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { DashboardView, NavigationFilterOptions } from './components/dashboard/DashboardView';
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
import { CargaMasivaView } from './components/admin/CargaMasivaView';
import { ProfileView } from './components/profile/ProfileView';
import { LoginView } from './components/auth/LoginView';
import { SIAADataService } from './services/siaaService';
import { BulkEntityType } from './services/bulkImportService';
import { Asesoria } from './types/siaa';

function SIAAApp() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [selectedAdvisoryId, setSelectedAdvisoryId] = useState<string | null>(null);
  const [isNewSolicitudModalOpen, setIsNewSolicitudModalOpen] = useState(false);
  const [editingSolicitud, setEditingSolicitud] = useState<Asesoria | null>(null);
  const [advisoryToAssign, setAdvisoryToAssign] = useState<Asesoria | null>(null);
  const [advisoryToFollowUp, setAdvisoryToFollowUp] = useState<Asesoria | null>(null);
  const [bulkEntity, setBulkEntity] = useState<BulkEntityType>('usuarios');
  const [dataVersion, setDataVersion] = useState(0);
  const [navPreset, setNavPreset] = useState<{
    estado?: string;
    fecha?: string;
    carreraId?: string;
    key: number;
  }>({ key: 0 });

  useEffect(() => {
    setCurrentView('dashboard');
    setIsSidebarOpen(false);
    setNavPreset(prev => ({ key: prev.key + 1 }));
  }, [currentUser?.uid]);

  useEffect(() => {
    const bump = () => setDataVersion(v => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'siaa_asesorias' || e.key === 'siaa_notifications') {
        bump();
      }
    };
    window.addEventListener('siaa-asesorias-updated', bump);
    window.addEventListener('storage', onStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('siaa-realtime-sync');
        channel.onmessage = () => bump();
      } catch {
        channel = null;
      }
    }

    return () => {
      window.removeEventListener('siaa-asesorias-updated', bump);
      window.removeEventListener('storage', onStorage);
      try {
        channel?.close();
      } catch {
        // Ignore close errors
      }
    };
  }, []);

  // Re-fetch advisory when needed
  void dataVersion;
  const selectedAdvisory = selectedAdvisoryId
    ? SIAADataService.getAsesoriaById(selectedAdvisoryId)
    : null;

  if (!currentUser) {
    return <LoginView />;
  }

  const handleNavigate = (view: NavView, options?: NavigationFilterOptions) => {
    if (view === 'solicitar') {
      setEditingSolicitud(null);
      setIsNewSolicitudModalOpen(true);
      return;
    }
    setNavPreset(prev => ({
      estado: options?.estado,
      fecha: options?.fecha,
      carreraId: options?.carreraId,
      key: prev.key + 1
    }));
    setCurrentView(view);
  };

  const handleSelectAdvisory = (id: string) => {
    setSelectedAdvisoryId(id);
  };

  const handleSolicitudSuccess = (savedId: string) => {
    setDataVersion(v => v + 1);
    if (!editingSolicitud) {
      setSelectedAdvisoryId(savedId);
      setCurrentView('solicitudes');
    }
    setEditingSolicitud(null);
  };

  const handleOpenCreateSolicitud = () => {
    setEditingSolicitud(null);
    setIsNewSolicitudModalOpen(true);
  };

  const handleOpenEditSolicitud = (asesoria: Asesoria) => {
    setEditingSolicitud(asesoria);
    setIsNewSolicitudModalOpen(true);
  };

  const handleOpenBulkImport = (entity: BulkEntityType) => {
    setBulkEntity(entity);
    setCurrentView('carga_masiva');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 antialiased transition-colors duration-200">
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
              onOpenSolicitudModal={handleOpenCreateSolicitud}
            />
          )}

          {currentView === 'solicitudes' && (
            <SolicitudesList
              onSelectAdvisory={handleSelectAdvisory}
              onOpenNewModal={handleOpenCreateSolicitud}
              onOpenEditModal={handleOpenEditSolicitud}
              onOpenAssignModal={(a) => setAdvisoryToAssign(a)}
              initialEstado={navPreset.estado}
              presetKey={navPreset.key}
              refreshKey={dataVersion}
            />
          )}

          {currentView === 'asesorias' && (
            <AsesoriasList
              onSelectAdvisory={handleSelectAdvisory}
              onOpenSeguimiento={(a) => setAdvisoryToFollowUp(a)}
              onOpenEditModal={handleOpenEditSolicitud}
              onOpenAssignModal={(a) => setAdvisoryToAssign(a)}
              isHistoryView={false}
              initialEstado={navPreset.estado}
              initialFecha={navPreset.fecha}
              initialCarrera={navPreset.carreraId}
              presetKey={navPreset.key}
              refreshKey={dataVersion}
            />
          )}

          {currentView === 'historial' && (
            <AsesoriasList
              onSelectAdvisory={handleSelectAdvisory}
              onOpenSeguimiento={(a) => setAdvisoryToFollowUp(a)}
              onOpenEditModal={handleOpenEditSolicitud}
              onOpenAssignModal={(a) => setAdvisoryToAssign(a)}
              isHistoryView={true}
              initialEstado={navPreset.estado}
              initialFecha={navPreset.fecha}
              initialCarrera={navPreset.carreraId}
              presetKey={navPreset.key}
              refreshKey={dataVersion}
            />
          )}

          {currentView === 'seguimiento' && (
            <AsesoriasList
              onSelectAdvisory={handleSelectAdvisory}
              onOpenSeguimiento={(a) => setAdvisoryToFollowUp(a)}
              onOpenEditModal={handleOpenEditSolicitud}
              onOpenAssignModal={(a) => setAdvisoryToAssign(a)}
              isHistoryView={false}
              initialEstado={navPreset.estado}
              initialFecha={navPreset.fecha}
              initialCarrera={navPreset.carreraId}
              presetKey={navPreset.key}
              refreshKey={dataVersion}
            />
          )}

          {currentView === 'calendario' && (
            <CalendarView onSelectAdvisory={handleSelectAdvisory} />
          )}

          {currentView === 'disponibilidad' && (
            <DisponibilidadView onOpenBulkImport={() => handleOpenBulkImport('disponibilidad')} />
          )}

          {currentView === 'usuarios' && (
            <UsuariosView onOpenBulkImport={() => handleOpenBulkImport('usuarios')} />
          )}

          {(currentView === 'carreras' ||
            currentView === 'materias' ||
            currentView === 'grupos' ||
            currentView === 'cuatrimestres' ||
            currentView === 'aulas') && (
            <CatalogosView
              initialType={currentView as CatalogoTipo}
              onOpenBulkImport={(catalog) => handleOpenBulkImport(catalog)}
            />
          )}

          {currentView === 'carga_masiva' && (
            <CargaMasivaView
              initialEntity={bulkEntity}
              onImportSuccess={() => setDataVersion(v => v + 1)}
            />
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

      {/* 2. Nueva / Editar Solicitud de Asesoría Form */}
      <SolicitudFormModal
        isOpen={isNewSolicitudModalOpen}
        onClose={() => {
          setIsNewSolicitudModalOpen(false);
          setEditingSolicitud(null);
        }}
        onSuccess={handleSolicitudSuccess}
        editingAsesoria={editingSolicitud}
      />

      {/* 3. Modal de Asignación / Reprogramación de Horario / Docente / Aula */}
      <AsignacionModal
        isOpen={!!advisoryToAssign}
        onClose={() => setAdvisoryToAssign(null)}
        asesoria={advisoryToAssign}
        onSuccess={() => {
          setAdvisoryToAssign(null);
          setDataVersion(v => v + 1);
        }}
      />

      {/* 4. Modal de Registro / Edición / Eliminación de Seguimiento */}
      <SeguimientoModal
        isOpen={!!advisoryToFollowUp}
        onClose={() => setAdvisoryToFollowUp(null)}
        asesoria={advisoryToFollowUp}
        onSuccess={() => {
          setAdvisoryToFollowUp(null);
          setDataVersion(v => v + 1);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SIAAApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
