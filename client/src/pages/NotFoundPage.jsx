import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-sm"
            style={{
              width: Math.random() * 60 + 20 + 'px',
              height: Math.random() * 60 + 20 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, Math.random() * -100 - 50],
              x: [0, Math.random() * 50 - 25],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-8xl mb-6"
        >
          🔍
        </motion.div>
        <h1 className="text-6xl font-bold font-display gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Page Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
          Looks like this page got lost too. Let&apos;s help you find your way back.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="gradient" size="lg">Go Home</Button>
          </Link>
          <Link to="/search">
            <Button variant="secondary" size="lg">Search Items</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
