import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUsers, HiOutlineCollection, HiOutlineClipboardList, HiOutlineFlag, HiOutlineCheckCircle, HiOutlineTrendingUp, HiOutlineBan, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';
import { adminService } from '../services/services';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminDashboardPage() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    adminService.getDashboard()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      adminService.getUsers({ search: userSearch })
        .then(res => setUsers(res.data.users))
        .catch(() => {});
    }
    if (tab === 'reports') {
      adminService.getReports()
        .then(res => setReports(res.data))
        .catch(() => {});
    }
  }, [tab, userSearch]);

  const handleBan = async (id) => {
    try {
      const res = await adminService.toggleBan(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: res.data.is_banned } : u));
      toast.success(res.data.message);
    } catch { toast.error('Failed'); }
  };

  const handleDeleteItem = async (id) => {
    try {
      await adminService.deleteItem(id);
      toast.success('Item deleted');
    } catch { toast.error('Failed'); }
  };

  const handleReportUpdate = async (id, status) => {
    try {
      await adminService.updateReport(id, status);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toast.success('Report updated');
    } catch { toast.error('Failed'); }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <HiOutlineTrendingUp /> },
    { id: 'users', label: 'Users', icon: <HiOutlineUsers /> },
    { id: 'reports', label: 'Reports', icon: <HiOutlineFlag /> },
  ];

  const statCards = stats ? [
    { label: 'Total Users', value: stats.stats.total_users, icon: <HiOutlineUsers className="text-primary-500" size={28} />, color: 'from-primary-500/10 to-purple-500/10' },
    { label: 'Total Items', value: stats.stats.total_items, icon: <HiOutlineCollection className="text-accent-500" size={28} />, color: 'from-accent-500/10 to-emerald-500/10' },
    { label: 'Total Claims', value: stats.stats.total_claims, icon: <HiOutlineClipboardList className="text-amber-500" size={28} />, color: 'from-amber-500/10 to-orange-500/10' },
    { label: 'Items Returned', value: stats.stats.returned_items, icon: <HiOutlineCheckCircle className="text-emerald-500" size={28} />, color: 'from-emerald-500/10 to-green-500/10' },
    { label: 'Pending Reports', value: stats.stats.pending_reports, icon: <HiOutlineFlag className="text-rose-500" size={28} />, color: 'from-rose-500/10 to-pink-500/10' },
    { label: 'New Users (7d)', value: stats.stats.new_users_week, icon: <HiOutlineTrendingUp className="text-cyan-500" size={28} />, color: 'from-cyan-500/10 to-blue-500/10' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-6">⚙️ Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Skeleton variant="card" className="h-32" count={6} />
            </div>
          ) : stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statCards.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`glass-card p-5 bg-gradient-to-br ${s.color}`}>
                    <div className="flex items-center justify-between mb-3">{s.icon}</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{s.value}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Categories breakdown */}
              {stats.categories?.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📊 Items by Category</h3>
                  <div className="space-y-3">
                    {stats.categories.map(cat => {
                      const pct = Math.round((parseInt(cat.count) / stats.stats.total_items) * 100) || 0;
                      return (
                        <div key={cat.category} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 dark:text-slate-300 w-24 truncate">{cat.category}</span>
                          <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-12 text-right">{cat.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white" />
              </div>
            </div>

            {users.map(u => (
              <div key={u.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white font-bold overflow-hidden">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{u.name}</p>
                      {u.role === 'admin' && <Badge variant="primary" size="xs">Admin</Badge>}
                      {u.is_banned && <Badge variant="danger" size="xs">Banned</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{u.email} • {u.uploads_count} uploads • Joined {format(new Date(u.created_at), 'MMM yyyy')}</p>
                  </div>
                </div>
                {u.role !== 'admin' && (
                  <Button variant={u.is_banned ? 'accent' : 'danger'} size="sm" icon={<HiOutlineBan />} onClick={() => handleBan(u.id)}>
                    {u.is_banned ? 'Unban' : 'Ban'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div className="space-y-4">
            {reports.length > 0 ? reports.map(r => (
              <div key={r.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {r.item_image && <img src={r.item_image} alt="" className="w-16 h-16 rounded-xl object-cover" />}
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{r.item_title}</p>
                      <p className="text-xs text-slate-500">Reported by {r.reporter_name} • {r.reason}</p>
                      <div className="mt-1"><Badge variant={r.status === 'pending' ? 'warning' : r.status === 'reviewed' ? 'success' : 'default'} size="xs">{r.status}</Badge></div>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button variant="danger" size="sm" icon={<HiOutlineTrash />} onClick={() => { handleDeleteItem(r.item_id); handleReportUpdate(r.id, 'reviewed'); }}>Remove</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleReportUpdate(r.id, 'dismissed')}>Dismiss</Button>
                    </div>
                  )}
                </div>
              </div>
            )) : <p className="text-center text-slate-400 py-8">No reports</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
