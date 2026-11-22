import { Analytics } from '@vercel/analytics/react';
import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Journal from './pages/Journal';
import JournalPost from './pages/JournalPost';
import Services from './pages/Services';
import StartProject from './pages/StartProject';
import Sharp from './pages/Sharp';
import SharpDeal from './pages/SharpDeal';
import Socials from './pages/Socials';
import Contact from './pages/Contact';
import Support from './pages/Support';
import AdminOverview from './pages/AdminOverview';
import AdminProjects from './pages/AdminProjects';
import AdminInquiries from './pages/AdminInquiries';
import AdminInquiryDetail from './pages/AdminInquiryDetail';
import AdminJournal from './pages/AdminJournal';
import AdminSharp from './pages/AdminSharp';
import AdminPayments from './pages/AdminPayments';
import AdminCommunications from './pages/AdminCommunications';
import AdminActivity from './pages/AdminActivity';
import AdminSettings from './pages/AdminSettings';
import AdminPlaceholder from './components/AdminPlaceholder';
import NotFound from './pages/NotFound';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
};

const isAdminHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'me.pantane.is-a.dev' || window.location.hostname === 'me.localhost');

const App: React.FC = () => {
  useEffect(() => {
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      robotsMeta.setAttribute('content', isAdminHost ? 'noindex, nofollow' : 'index, follow');
    }
    return () => {
      if (robotsMeta) robotsMeta.setAttribute('content', 'index, follow');
    };
  }, [isAdminHost]);

  if (isAdminHost) {
    return (
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="journal" element={<AdminJournal />} />
            <Route path="sharp" element={<AdminSharp />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="inquiries/:id" element={<AdminInquiryDetail />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="communications" element={<AdminCommunications />} />
            <Route path="access" element={<AdminPlaceholder title="Access" description="Administrator and session management will be expanded in a later security mission." />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AdminAuthProvider>
    );
  }

  return (
    <Layout>
      <ScrollToTop />
      <Analytics />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/:slug" element={<JournalPost />} />
        <Route path="/services" element={<Services />} />
        <Route path="/start-project" element={<StartProject />} />
        <Route path="/sharp" element={<Sharp />} />
        <Route path="/sharp/:slug" element={<SharpDeal />} />
        <Route path="/socials" element={<Socials />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/support" element={<Support />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default App;