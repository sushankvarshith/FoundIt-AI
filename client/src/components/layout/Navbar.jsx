import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiOutlineBell, HiOutlinePlus, HiOutlineMenu, HiOutlineX, HiOutlineSun, HiOutlineMoon, HiOutlineUser, HiOutlineLogout, HiOutlineCollection, HiOutlineBookmark, HiOutlineChatAlt2, HiOutlineClipboardList, HiOutlineCog } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useClickOutside } from '../../hooks/useHooks';
import Button from '../ui/Button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useClickOutside(profileRef, () => setProfileOpen(false));

  const navLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/search', label: 'AI Search', icon: '🔍' },
    { path: '/upload', label: 'Upload', icon: '📤', protected: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled 
        ? 'glass shadow-lg border-b border-white/10' 
        : 'bg-transparent border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/30"
            >
              F
            </motion.div>
            <span className="text-xl font-bold font-display">
              <span className="gradient-text">FindIt</span>
              <span className="text-slate-400 ml-1 text-sm font-medium">AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              (!link.protected || user) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="mr-1.5">{link.icon}</span>
                  {link.label}
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary-500 rounded-t-full"
                    />
                  )}
                </Link>
              )
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {isDark ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
            </motion.button>

            {user ? (
              <>
                {/* Upload button */}
                <Link to="/upload" className="hidden sm:block">
                  <Button size="sm" variant="gradient" icon={<HiOutlinePlus />}>
                    Upload
                  </Button>
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                  <HiOutlineBell size={20} />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-12 w-64 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                          <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>

                        {[
                          { to: '/profile', icon: <HiOutlineUser />, label: 'Profile' },
                          { to: '/my-uploads', icon: <HiOutlineCollection />, label: 'My Uploads' },
                          { to: '/bookmarks', icon: <HiOutlineBookmark />, label: 'Bookmarks' },
                          { to: '/claims', icon: <HiOutlineClipboardList />, label: 'Claims' },
                          { to: '/messages', icon: <HiOutlineChatAlt2 />, label: 'Messages' },
                          ...(user.role === 'admin' ? [{ to: '/admin', icon: <HiOutlineCog />, label: 'Admin Panel' }] : []),
                        ].map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <span className="text-lg text-slate-400 mr-3">{item.icon}</span>
                            {item.label}
                            {item.to === '/messages' && unreadCount > 0 && (
                              <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </Link>
                        ))}

                        <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                          <button
                            onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 w-full transition-colors"
                          >
                            <HiOutlineLogout size={18} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button variant="gradient" size="sm">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              {mobileMenuOpen ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1 glass border-t border-white/10">
              {navLinks.map(link => (
                (!link.protected || user) && (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium ${
                      isActive(link.path)
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.label}
                  </Link>
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
