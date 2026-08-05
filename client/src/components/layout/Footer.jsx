import { Link } from 'react-router-dom';
import { HiOutlineHeart } from 'react-icons/hi';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold">
                F
              </div>
              <span className="text-lg font-bold font-display">
                <span className="gradient-text">FindIt</span>
                <span className="text-slate-400 ml-1 text-xs">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI-powered platform to reconnect owners with their lost belongings.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              {[{ to: '/', label: 'Browse Items' }, { to: '/search', label: 'AI Search' }, { to: '/upload', label: 'Upload Found Item' }].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-2">
              {[{ to: '/profile', label: 'Profile' }, { to: '/my-uploads', label: 'My Uploads' }, { to: '/bookmarks', label: 'Bookmarks' }].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wider">Help</h4>
            <ul className="space-y-2">
              {[{label: 'How it Works', to: '/'}, {label: 'Safety Tips', to: '/'}, {label: 'Contact Us', to: '/'}].map(item => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors cursor-pointer">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            © {new Date().getFullYear()} FindIt AI. Made with <HiOutlineHeart className="text-rose-400" /> for the community.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            AI-powered image matching • Secure • Privacy-first
          </p>
        </div>
      </div>
    </footer>
  );
}
