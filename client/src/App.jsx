import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StatsProvider } from './context/StatsContext';
import { CelebrationProvider } from './context/CelebrationContext';
import Layout from './components/layout/Layout/Layout';
import HomePage from './pages/HomePage/HomePage';
import ProjectsPage from './pages/ProjectsPage/ProjectsPage';
import BraindumpPage from './pages/BraindumpPage/BraindumpPage';
import InbasketPage from './pages/InbasketPage/InbasketPage';
import SomedayPage from './pages/SomedayPage/SomedayPage';

export default function App() {
  return (
    <BrowserRouter>
      <StatsProvider>
        <CelebrationProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="braindump" element={<BraindumpPage />} />
              <Route path="inbasket" element={<InbasketPage />} />
              <Route path="someday" element={<SomedayPage />} />
            </Route>
          </Routes>
        </CelebrationProvider>
      </StatsProvider>
    </BrowserRouter>
  );
}
