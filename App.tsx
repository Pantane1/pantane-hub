import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Journal from './pages/Journal';
import JournalPost from './pages/JournalPost';
import Sharp from './pages/Sharp';
import SharpDeal from './pages/SharpDeal';
import Socials from './pages/Socials';
import Contact from './pages/Contact';
import Support from '/pages/Support';
import AdminJournal from './pages/AdminJournal';
import NotFound from './pages/NotFound';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
};

const App: React.FC = () => (
  <Layout>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/journal/:slug" element={<JournalPost />} />
      <Route path="/sharp" element={<Sharp />} />
      <Route path="/sharp/:slug" element={<SharpDeal />} />
      <Route path="/socials" element={<Socials />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/support" element={<Support />} />
      {/* Not linked in nav — reachable only if you know the URL */}
      <Route path="/admin/journal" element={<AdminJournal />} />
      {/* Fallback — dedicated 404, noindex, distinct from silently duplicating Home content */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

export default App;
