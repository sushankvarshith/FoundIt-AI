import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineTrash, HiOutlinePencil, HiOutlineEye, HiOutlineHeart, HiOutlineChatAlt2, HiOutlineShare, HiOutlineCheckCircle, HiOutlineSearch } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/services';
import { StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { ItemGridSkeleton } from '../components/ui/Skeleton';
import ShareModal from '../components/share/ShareModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function MyUploadsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [shareItem, setShareItem] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filter) params.status = filter;
      const res = await itemService.getUserItems(user.id, params);
      setItems(res.data.items);
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await itemService.delete(deleteId);
      setItems(prev => prev.filter(i => i.id !== deleteId));
      setDeleteId(null);
      toast.success('Item deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await itemService.updateStatus(id, status);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      toast.success(`Marked as ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  const filters = [
    { value: '', label: 'All' },
    { value: 'found', label: 'Found' },
    { value: 'claimed', label: 'Claimed' },
    { value: 'returned', label: 'Returned' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">📦 My Uploads</h1>
          <Link to="/upload"><Button variant="gradient" size="sm">+ New Upload</Button></Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {filters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.value ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <ItemGridSkeleton count={4} /> : items.length > 0 ? (
          <div className="space-y-4">
            {items.map(item => {
              const img = item.primary_image || (item.images && item.images[0] && (item.images[0].url || item.images[0].image_url));
              return (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    <Link to={`/items/${item.id}`} className="flex-shrink-0">
                      <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img src={img || 'https://placehold.co/200/6366f1/fff?text=📷'} alt="" className="w-full h-full object-cover" />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link to={`/items/${item.id}`} className="text-lg font-semibold text-slate-900 dark:text-white hover:text-primary-500 transition-colors">
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={item.status} />
                            <span className="text-xs text-slate-400">{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><HiOutlineEye size={14} /> {item.views_count || 0} views</span>
                        <span className="flex items-center gap-1"><HiOutlineHeart size={14} /> {item.likes_count || 0} likes</span>
                        <span className="flex items-center gap-1"><HiOutlineChatAlt2 size={14} /> {item.comments_count || 0} comments</span>
                        <span className="flex items-center gap-1"><HiOutlineShare size={14} /> {item.shares_count || 0} shares</span>
                        {item.claims_count > 0 && (
                          <span className="flex items-center gap-1 text-amber-500 font-medium">📋 {item.claims_count} claims</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Link to={`/items/${item.id}`}>
                          <Button variant="ghost" size="sm" icon={<HiOutlineEye />}>View</Button>
                        </Link>
                        <Button variant="ghost" size="sm" icon={<HiOutlineShare />} onClick={() => setShareItem(item)}>Share</Button>
                        {item.status === 'found' && (
                          <Button variant="ghost" size="sm" icon={<HiOutlineCheckCircle />} onClick={() => handleStatusChange(item.id, 'returned')} className="!text-emerald-500">Mark Returned</Button>
                        )}
                        <Button variant="ghost" size="sm" icon={<HiOutlineTrash />} onClick={() => setDeleteId(item.id)} className="!text-rose-500">Delete</Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState type="noItems" action={<Link to="/upload"><Button variant="gradient">Upload Your First Item</Button></Link>} />
        )}
      </motion.div>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Item?" size="sm">
        <p className="text-sm text-slate-500 mb-4">This action cannot be undone. All images and data will be permanently deleted.</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      {shareItem && <ShareModal isOpen={!!shareItem} onClose={() => setShareItem(null)} itemId={shareItem.id} itemTitle={shareItem.title} />}
    </div>
  );
}
