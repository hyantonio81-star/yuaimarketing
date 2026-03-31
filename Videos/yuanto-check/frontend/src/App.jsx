import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { SyncProvider } from './context/SyncContext';
import { InspectionFlowProvider } from './context/InspectionFlowContext';
import CEO_Dashboard from './components/Dashboard';
import SentinelDashboard from './components/SentinelDashboard';
import MobileUserHome from './components/MobileUserHome';
import RoleSwitcher from './components/RoleSwitcher';
import UserManagement from './components/UserManagement';
import OrganizationSettings from './components/OrganizationSettings';
import Login from './components/Login';
import IncentivosDashboard from './components/IncentivosDashboard';
import KpiGoalsPage from './components/KpiGoalsPage';
import SmartChecklist from './components/SmartChecklist';
import DashboardLayout from './components/DashboardLayout';
import DeptModule from './components/DeptModule';
import PersonalDashboard from './components/PersonalDashboard';
import DocumentMaster from './components/DocumentMaster';
import RepuestosModule from './components/RepuestosModule';
import InventoryModule from './components/InventoryModule';
import OrdenesTrabajoModule from './components/OrdenesTrabajoModule';
import PlantEquipmentPage from './components/PlantEquipmentPage';
import InspeccionMaqPage from './components/inspeccionMaq/InspeccionMaqPage';
import InspeccionCajaPage from './components/inspeccionCaja/InspeccionCajaPage';
import CalendarioPage from './components/CalendarioPage';
import ReservasPage from './components/ReservasPage';
import TeamReviewPage from './components/TeamReviewPage';
import MaintenanceDashboard from './components/MaintenanceDashboard';
import VehicleManagement from './components/VehicleManagement';
import FieldPhotoReport from './components/FieldPhotoReport';
import MobileCrmHub from './components/MobileCrmHub';
import RollCalcPage from './components/RollCalcPage';
import CorrugadoBomPage from './components/CorrugadoBomPage';
import PlanchaScanPage from './components/PlanchaScanPage';
import CalidadDefectosPage from './components/CalidadDefectosPage';
import CtqDashboardPage from './components/CtqDashboardPage';
import QcSopSummaryPage from './components/QcSopSummaryPage';
import QcEntryPage from './components/QcEntryPage';
import CalidadMetodologiaPage from './components/CalidadMetodologiaPage';
import ClaimAnalysisPage from './components/ClaimAnalysisPage';
import RcaReportPage from './components/RcaReportPage';
import CtqGerenciaChecklistPage from './components/CtqGerenciaChecklistPage';
import Capitulo3CierrePage from './components/Capitulo3CierrePage';
import MsaCapitulo4Page from './components/MsaCapitulo4Page';
import Medicion421Page from './components/Medicion421Page';
import DailyQualityDashboardPage from './components/DailyQualityDashboardPage';
import Capitulo43DatosPage from './components/Capitulo43DatosPage';
import Capitulo44InspeccionPage from './components/Capitulo44InspeccionPage';
import BitacoraCalidadPage from './components/BitacoraCalidadPage';
import Capitulo45FormulariosMsaPage from './components/Capitulo45FormulariosMsaPage';
import Capitulo47ConcordanciaPage from './components/Capitulo47ConcordanciaPage';
import Capitulo48VariablesPage from './components/Capitulo48VariablesPage';
import Capitulo49VisualPage from './components/Capitulo49VisualPage';
import Capitulo410ResumenEjecutivoPage from './components/Capitulo410ResumenEjecutivoPage';
import Capitulo411413GestionPage from './components/Capitulo411413GestionPage';
import Capitulo414416CierrePage from './components/Capitulo414416CierrePage';
import Capitulo5CorrugadorPage from './components/Capitulo5CorrugadorPage';
import Capitulo6ConversionPage from './components/Capitulo6ConversionPage';
import Capitulo7SmedPage from './components/Capitulo7SmedPage';
import Capitulo8WipFlujoPage from './components/Capitulo8WipFlujoPage';
import Capitulo9OeeKaizenPage from './components/Capitulo9OeeKaizenPage';
import ErrorBoundary from './components/ErrorBoundary';
import PageErrorBoundary from './components/PageErrorBoundary';

function RequireGerencia({ children }) {
  const { user } = useAuth();
  const r = (user?.role || 'staff').toString().toLowerCase();
  if (!['ceo', 'director', 'manager', 'leader'].includes(r)) {
    return <Navigate to="/mobile" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const on401 = () => { logout(); navigate('/login', { replace: true }); };
    window.addEventListener('yuanto-401', on401);
    return () => window.removeEventListener('yuanto-401', on401);
  }, [logout, navigate]);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  const role = (user.role || 'staff').toString().toLowerCase();
  const isStaff = role === 'staff';
  const isDashboard = ['ceo', 'director', 'manager', 'leader'].includes(role);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={isStaff ? '/mobile' : '/dashboard'} replace />} />
      <Route path="/mobile" element={<MobileUserHome />} />
      <Route path="/mobile/dashboard" element={<PersonalDashboard />} />
      <Route path="/mobile/tasks" element={<Navigate to="/mobile/smart" replace />} />
      <Route path="/mobile/smart" element={<SmartChecklist />} />
      <Route path="/mobile/field-report" element={<FieldPhotoReport />} />
      <Route path="/mobile/crm" element={<MobileCrmHub />} />
      <Route path="/mobile/roll-calc" element={<RollCalcPage backTo="/mobile" />} />
      <Route path="/mobile/bom-corrugado" element={<CorrugadoBomPage backTo="/mobile" />} />
      <Route path="/mobile/inventario-escaner" element={<PlanchaScanPage backTo="/mobile" />} />
      <Route path="/mobile/calidad-defectos" element={<CalidadDefectosPage backTo="/mobile" />} />
      <Route path="/mobile/sop-qc-01" element={<QcSopSummaryPage backTo="/mobile" />} />
      <Route path="/mobile/qc-entry" element={<QcEntryPage backTo="/mobile" />} />
      <Route path="/mobile/calidad-metodologia" element={<CalidadMetodologiaPage backTo="/mobile" />} />
      <Route path="/mobile/calidad-ctq" element={<CtqDashboardPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo3-cierre" element={<Capitulo3CierrePage backTo="/mobile" />} />
      <Route path="/mobile/msa-capitulo4" element={<MsaCapitulo4Page backTo="/mobile" />} />
      <Route path="/mobile/medicion-421" element={<Medicion421Page backTo="/mobile" />} />
      <Route path="/mobile/calidad-diaria" element={<DailyQualityDashboardPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo4-datos" element={<Capitulo43DatosPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo4-inspeccion" element={<Capitulo44InspeccionPage backTo="/mobile" />} />
      <Route path="/mobile/bitacora-calidad" element={<BitacoraCalidadPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo4-formularios-msa" element={<Capitulo45FormulariosMsaPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo4-concordancia" element={<Capitulo47ConcordanciaPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo4-variables" element={<Capitulo48VariablesPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo4-visual" element={<Capitulo49VisualPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo4-resumen-ejecutivo" element={<Capitulo410ResumenEjecutivoPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo4-lpa-escalacion" element={<Capitulo411413GestionPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo4-cierre-implementacion" element={<Capitulo414416CierrePage backTo="/mobile" />} />
      <Route path="/mobile/capitulo5-corrugador" element={<Capitulo5CorrugadorPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo6-conversion" element={<Capitulo6ConversionPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo7-smed" element={<Capitulo7SmedPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo8-wip-flujo" element={<Capitulo8WipFlujoPage backTo="/mobile" />} />
      <Route path="/mobile/capitulo9-oee-kaizen" element={<Capitulo9OeeKaizenPage backTo="/mobile" />} />
      <Route path="/mobile/claim-analysis" element={<ClaimAnalysisPage backTo="/mobile" />} />
      <Route path="/mobile/rca-report" element={<RcaReportPage backTo="/mobile" />} />
      <Route path="/mobile/chapter3-checklist" element={<RequireGerencia><CtqGerenciaChecklistPage backTo="/mobile" /></RequireGerencia>} />
      <Route path="/mobile/inspeccion-maq" element={<PageErrorBoundary fallbackTitleKey="error_boundary_title" fallbackMessageKey="error_boundary_message"><InspeccionMaqPage /></PageErrorBoundary>} />
      <Route path="/mobile/inspeccion-caja" element={<PageErrorBoundary fallbackTitleKey="error_boundary_title" fallbackMessageKey="error_boundary_message"><InspeccionCajaPage /></PageErrorBoundary>} />
      <Route path="/dashboard" element={isDashboard ? <DashboardLayout /> : <Navigate to="/mobile" replace />}>
        <Route index element={<PageErrorBoundary fallbackTitleKey="error_boundary_title" fallbackMessageKey="error_boundary_message"><SentinelDashboard /></PageErrorBoundary>} />
        <Route path="old-dashboard" element={<CEO_Dashboard />} />
        <Route path="org-chart" element={<Navigate to="/dashboard/organization" replace />} />
        <Route path="organization" element={<PageErrorBoundary fallbackTitleKey="org_error_title" fallbackMessageKey="org_error_message"><OrganizationSettings /></PageErrorBoundary>} />
        <Route path="team" element={<TeamReviewPage />} />
        <Route path="dept" element={<DeptModule />} />
        <Route path="mantenimiento-dashboard" element={<MaintenanceDashboard />} />
        <Route path="mantenimiento" element={<DeptModule presetDeptName="MANTENIMIENTO" />} />
        <Route path="repuestos" element={<RepuestosModule />} />
        <Route path="inventory" element={<InventoryModule />} />
        <Route path="inventory/taller" element={<InventoryModule mode="taller" />} />
        <Route path="inventory/higiene" element={<InventoryModule mode="hygiene" />} />
        <Route path="inventory/repuestos" element={<InventoryModule mode="spare_parts" />} />
        <Route path="inventory/materia-prima" element={<InventoryModule mode="materia_prima" />} />
        <Route path="inventory/materia-insumo-primaria" element={<InventoryModule mode="materia_insumo_primaria" />} />
        <Route path="roll-calc" element={<RollCalcPage backTo="/dashboard" />} />
        <Route path="bom-corrugado" element={<CorrugadoBomPage backTo="/dashboard" />} />
        <Route path="inventario-escaner" element={<PlanchaScanPage backTo="/dashboard" />} />
        <Route path="calidad-defectos" element={<CalidadDefectosPage backTo="/dashboard" />} />
        <Route path="calidad-ctq" element={<CtqDashboardPage backTo="/dashboard" />} />
        <Route path="sop-qc-01" element={<QcSopSummaryPage backTo="/dashboard" />} />
        <Route path="qc-entry" element={<QcEntryPage backTo="/dashboard" />} />
        <Route path="calidad-metodologia" element={<CalidadMetodologiaPage backTo="/dashboard" />} />
        <Route path="claim-analysis" element={<ClaimAnalysisPage backTo="/dashboard" />} />
        <Route path="rca-report" element={<RcaReportPage backTo="/dashboard" />} />
        <Route path="chapter3-checklist" element={<CtqGerenciaChecklistPage backTo="/dashboard" />} />
        <Route path="capitulo3-cierre" element={<Capitulo3CierrePage backTo="/dashboard" />} />
        <Route path="msa-capitulo4" element={<MsaCapitulo4Page backTo="/dashboard" />} />
        <Route path="medicion-421" element={<Medicion421Page backTo="/dashboard" />} />
        <Route path="calidad-diaria" element={<DailyQualityDashboardPage backTo="/dashboard" />} />
        <Route path="capitulo4-datos" element={<Capitulo43DatosPage backTo="/dashboard" />} />
        <Route path="capitulo4-inspeccion" element={<Capitulo44InspeccionPage backTo="/dashboard" />} />
        <Route path="bitacora-calidad" element={<BitacoraCalidadPage backTo="/dashboard" />} />
        <Route path="capitulo4-formularios-msa" element={<Capitulo45FormulariosMsaPage backTo="/dashboard" />} />
        <Route path="capitulo4-concordancia" element={<Capitulo47ConcordanciaPage backTo="/dashboard" />} />
        <Route path="capitulo4-variables" element={<Capitulo48VariablesPage backTo="/dashboard" />} />
        <Route path="capitulo4-visual" element={<Capitulo49VisualPage backTo="/dashboard" />} />
        <Route path="capitulo4-resumen-ejecutivo" element={<Capitulo410ResumenEjecutivoPage backTo="/dashboard" />} />
        <Route path="capitulo4-lpa-escalacion" element={<Capitulo411413GestionPage backTo="/dashboard" />} />
        <Route path="capitulo4-cierre-implementacion" element={<Capitulo414416CierrePage backTo="/dashboard" />} />
        <Route path="capitulo5-corrugador" element={<Capitulo5CorrugadorPage backTo="/dashboard" />} />
        <Route path="capitulo6-conversion" element={<Capitulo6ConversionPage backTo="/dashboard" />} />
        <Route path="capitulo7-smed" element={<Capitulo7SmedPage backTo="/dashboard" />} />
        <Route path="capitulo8-wip-flujo" element={<Capitulo8WipFlujoPage backTo="/dashboard" />} />
        <Route path="capitulo9-oee-kaizen" element={<Capitulo9OeeKaizenPage backTo="/dashboard" />} />
        <Route path="fleet" element={<VehicleManagement />} />
        <Route path="ordenes-trabajo" element={<OrdenesTrabajoModule />} />
        <Route path="plant-equipment" element={<PlantEquipmentPage />} />
        <Route path="inspeccion-maq" element={<PageErrorBoundary fallbackTitleKey="error_boundary_title" fallbackMessageKey="error_boundary_message"><InspeccionMaqPage /></PageErrorBoundary>} />
        <Route path="inspeccion-caja" element={<PageErrorBoundary fallbackTitleKey="error_boundary_title" fallbackMessageKey="error_boundary_message"><InspeccionCajaPage /></PageErrorBoundary>} />
        <Route path="documents" element={<DocumentMaster />} />
        <Route path="kpi-goals" element={<KpiGoalsPage />} />
        <Route path="incentives" element={<IncentivosDashboard />} />
        <Route path="personal" element={<PersonalDashboard />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="reservas" element={<PageErrorBoundary fallbackTitleKey="error_boundary_title" fallbackMessageKey="error_boundary_message"><ReservasPage /></PageErrorBoundary>} />
        <Route path="admin" element={<UserManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ConditionalRoleSwitcher() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;
  const onDashboard = location.pathname.startsWith('/dashboard');
  if (onDashboard) return null;
  return <RoleSwitcher />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SyncProvider>
          <InspectionFlowProvider>
            <ThemeProvider>
              <LanguageProvider>
                <ErrorBoundary>
                  <ConditionalRoleSwitcher />
                  <AppRoutes />
                </ErrorBoundary>
              </LanguageProvider>
            </ThemeProvider>
          </InspectionFlowProvider>
        </SyncProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
