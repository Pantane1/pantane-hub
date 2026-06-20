import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Socials from './pages/Socials';
import Contact from './pages/Contact';
import Support from './pages/Support';

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
      <Route path="/socials" element={<Socials />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/-support" element={<Support />} />
      {/* Fallback — redirect unknown paths to home */}
      <Route path="*" element={<Home />} />
    </Routes>
  </Layout>
);

export default App;
