import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageTransition } from '@/components/ui/Motion';
import { AppStateProvider } from '@/state/AppStateContext';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { IntelFeedPage } from '@/pages/IntelFeedPage';
import { TargetDatabasePage } from '@/pages/TargetDatabasePage';
import { IdentityForgePage } from '@/pages/IdentityForgePage';
import { ProtocolScanPage } from '@/pages/ProtocolScanPage';
import { OperationsPage } from '@/pages/OperationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function AppRoute({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Application */}
        <Route
          path="/dashboard"
          element={
            <AppRoute>
              <DashboardPage />
            </AppRoute>
          }
        />
        <Route
          path="/intel-feed"
          element={
            <AppRoute>
              <IntelFeedPage />
            </AppRoute>
          }
        />
        <Route
          path="/target-database"
          element={
            <AppRoute>
              <TargetDatabasePage />
            </AppRoute>
          }
        />
        <Route
          path="/identity-forge"
          element={
            <AppRoute>
              <IdentityForgePage />
            </AppRoute>
          }
        />
        <Route
          path="/protocol-scan"
          element={
            <AppRoute>
              <ProtocolScanPage />
            </AppRoute>
          }
        />
        <Route
          path="/operations"
          element={
            <AppRoute>
              <OperationsPage />
            </AppRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <AppRoute>
              <ProfilePage />
            </AppRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AppRoute>
              <SettingsPage />
            </AppRoute>
          }
        />

        <Route path="/index.html" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppStateProvider>
  );
}