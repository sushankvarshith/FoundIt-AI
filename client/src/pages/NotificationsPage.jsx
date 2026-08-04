import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineHeart, HiOutlineChatAlt2, HiOutlineClipboardList, HiOutlineShare, HiOutlineSparkles } from 'react-icons/hi';
import { notificationService } from '../services/services';
import { useSocket } from '../context/SocketContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  comment: <HiOutlineChatAlt2 className="text-blue-500" size={20} />,
  like: <HiOutlineHeart className="text-rose-500" size={20} />,
  claim: <HiOutlineClipboardList className="text-amber-500" size={20} />,
  claim_update: <HiOutlineCheckCircle className="text-emerald-500" size={20} />,
  share: <HiOutlineShare className="text-purple-500" size={20} />,
  ai_match: <HiOutlineSparkles className="text-primary-500" size={20} />,
  message: <HiOutlineChatAlt2 className="text-accent-500" size={20} />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useSocket();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getAll({ limit: 50 });
      setNotifications(res.data.notifications);
    } catch {} finally { setLoading(false); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const getLinkForNotification = (n) => {
    if (n.reference_type === 'item' && n.reference_id) return `/items/${n.reference_id}`;
    if (n.reference_type === 'message') return '/messages';
    return '#';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineBell /> Notifications
          </h1>
          {notifications.some(n => !n.is_read) && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark All Read</Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3"><Skeleton variant="card" className="h-20" count={5} /></div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map(n => (
              <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link
                  to={getLinkForNotification(n)}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`block glass-card p-4 transition-all hover:border-primary-300 ${!n.is_read ? 'border-l-4 border-l-primary-500 bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {typeIcons[n.type] || <HiOutlineBell className="text-slate-400" size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState type="noNotifications" />
        )}
      </motion.div>
    </div>
  );
}
