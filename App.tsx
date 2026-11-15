import { Analytics } from '@vercel/analytics/react';
import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Home from './pages/Home';
import Projects from './pages/Projects';
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

const App: React.FC = () => (
  <Layout>
    <ScrollToTop />
    <Analytics />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/journal/:slug" element={<JournalPost />} />
      <Route path="/services" element={<Services />} />
      <Route path="/start-project" element={<StartProject />} />
      <Route path="/sharp" element={<Sharp />} />
      <Route path="/sharp/:slug" element={<SharpDeal />} />
      <Route path="/socials" element={<Socials />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/support" element={<Support />} />
      {/* Central admin dashboard */}
      <Route path="/admin" element={<AdminAuthProvider><AdminLayout /></AdminAuthProvider>}>
        <Route index element={<AdminOverview />} />
        <Route path="journal" element={<AdminJournal />} />
        <Route path="sharp" element={<AdminSharp />} />
        <Route path="inquiries" element={<AdminInquiries />} />
        <Route path="inquiries/:id" element={<AdminInquiryDetail />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="communications" element={<AdminCommunications />} />
        <Route path="access" element={<AdminPlaceholder title="Access" description="Administrator and session management will be expanded in a later security mission." />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      {/* Fallback — dedicated 404, noindex, distinct from silently duplicating Home content */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

export default App;
