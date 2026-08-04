import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineX, HiOutlineChatAlt2 } from 'react-icons/hi';
import { claimService } from '../services/services';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ClaimsPage() {
  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      claimService.getReceived().then(r => setReceived(r.data)).catch(() => {}),
      claimService.getSent().then(r => setSent(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      await claimService.update(id, status);
      setReceived(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      toast.success(`Claim ${status}!`);
    } catch { toast.error('Failed to update'); }
  };

  const claims = tab === 'received' ? received : sent;
  const statusConfig = { pending: 'warning', accepted: 'success', rejected: 'danger' };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-6">📋 Claim Requests</h1>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('received')} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'received' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            Received ({received.length})
          </button>
          <button onClick={() => setTab('sent')} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'sent' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            Sent ({sent.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-4"><Skeleton variant="card" className="h-32" count={3} /></div>
        ) : claims.length > 0 ? (
          <div className="space-y-4">
            {claims.map(claim => (
              <motion.div key={claim.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to={`/items/${claim.item_id}`} className="flex-shrink-0">
                    <div className="w-full sm:w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img src={claim.item_image || 'https://placehold.co/200/6366f1/fff?text=📷'} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/items/${claim.item_id}`} className="font-semibold text-slate-900 dark:text-white hover:text-primary-500">
                          {claim.item_title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={statusConfig[claim.status]}>{claim.status}</Badge>
                          <span className="text-xs text-slate-400">{format(new Date(claim.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2"><strong>Reason:</strong> {claim.reason}</p>
                    {claim.description && <p className="text-sm text-slate-500 mt-1">{claim.description}</p>}

                    {tab === 'received' && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm text-slate-500 mr-2">From: <strong>{claim.claimant_name}</strong></span>
                        {claim.status === 'pending' && (
                          <>
                            <Button variant="accent" size="sm" icon={<HiOutlineCheck />} onClick={() => handleUpdate(claim.id, 'accepted')}>Accept</Button>
                            <Button variant="danger" size="sm" icon={<HiOutlineX />} onClick={() => handleUpdate(claim.id, 'rejected')}>Reject</Button>
                          </>
                        )}
                      </div>
                    )}
                    {tab === 'sent' && (
                      <p className="text-sm text-slate-500 mt-2">Finder: <strong>{claim.finder_name}</strong></p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState type="noClaims" />
        )}
      </motion.div>
    </div>
  );
}
