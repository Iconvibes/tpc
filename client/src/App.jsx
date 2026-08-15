import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import FX from './components/FX.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import WhatsAppFloat from './components/WhatsAppFloat.jsx';
import QuoteModal from './components/QuoteModal.jsx';
import { QuoteProvider } from './context/QuoteContext.jsx';
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import About from './pages/About.jsx';
import Tracking from './pages/Tracking.jsx';
import Contact from './pages/Contact.jsx';
import AdminApp from './admin/AdminApp.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function Shell() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
      <WhatsAppFloat />
      <QuoteModal />
    </>
  );
}

export default function App() {
  return (
    <QuoteProvider>
      <FX />
      <ScrollToTop />
      <Shell />
    </QuoteProvider>
  );
}
