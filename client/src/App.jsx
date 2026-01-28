import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StatsProvider } from './context/StatsContext';
import { CelebrationProvider } from './context/CelebrationContext';
import { OnboardingProvider } from './context/OnboardingContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import OnboardingModal from './components/onboarding/OnboardingModal';
import Layout from './components/layout/Layout/Layout';
import AuthPage from './pages/AuthPage/AuthPage';
import HomePage from './pages/HomePage/HomePage';
import ProjectsPage from './pages/ProjectsPage/ProjectsPage';
import BraindumpPage from './pages/BraindumpPage/BraindumpPage';
import InbasketPage from './pages/InbasketPage/InbasketPage';
import SomedayPage from './pages/SomedayPage/SomedayPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StatsProvider>
          <CelebrationProvider>
            <OnboardingProvider>
              <OnboardingModal />
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<HomePage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="braindump" element={<BraindumpPage />} />
                  <Route path="inbasket" element={<InbasketPage />} />
                  <Route path="someday" element={<SomedayPage />} />
                </Route>
              </Routes>
            </OnboardingProvider>
          </CelebrationProvider>
        </StatsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
