import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { Link } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Floating Action Button (Mobile) */}
      {user && (
        <Link
          to="/upload"
          className="fixed bottom-6 right-6 md:hidden z-30 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 text-white flex items-center justify-center shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 transition-all active:scale-95"
        >
          <HiOutlinePlus size={28} />
        </Link>
      )}
    </div>
  );
}
