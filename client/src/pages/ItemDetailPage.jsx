import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiHeart, HiOutlineShare, HiOutlineBookmark, HiBookmark, HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineEye, HiOutlinePhone, HiOutlineMail, HiOutlineFlag, HiOutlineQrcode, HiOutlineChatAlt2 } from 'react-icons/hi';
import { itemService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import ShareModal from '../components/share/ShareModal';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ItemDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({ reason: '', description: '' });
  const [reportOpen, setReportOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);

  useEffect(() => {
    fetchItem();
    fetchComments();
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await itemService.getById(id);
      setItem(res.data);
      setLiked(res.data.is_liked === true || res.data.is_liked === 'true');
      setLikesCount(parseInt(res.data.likes_count || 0));
      setBookmarked(res.data.is_bookmarked === true || res.data.is_bookmarked === 'true');
    } catch {
      toast.error('Item not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await itemService.getComments(id);
      setComments(res.data);
    } catch {}
  };

  const handleLike = async () => {
    if (!user) return toast.error('Please login');
    try {
      const res = await itemService.toggleLike(id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch {}
  };

  const handleBookmark = async () => {
    if (!user) return toast.error('Please login');
    try {
      const res = await itemService.toggleBookmark(id);
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? 'Bookmarked!' : 'Removed');
    } catch {}
  };

  const handleComment = async () => {
    if (!user) return toast.error('Please login');
    if (!newComment.trim()) return;
    try {
      await itemService.addComment(id, newComment, replyTo);
      setNewComment('');
      setReplyTo(null);
      fetchComments();
      toast.success('Comment posted!');
    } catch { toast.error('Failed to post comment'); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await itemService.deleteComment(commentId);
      fetchComments();
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleClaim = async () => {
    if (!claimForm.reason.trim()) return toast.error('Reason is required');
    try {
      const formData = new FormData();
      formData.append('reason', claimForm.reason);
      formData.append('description', claimForm.description);
      await itemService.submitClaim(id, formData);
      setClaimOpen(false);
      toast.success('Claim request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit claim');
    }
  };

  const handleReport = async (reason) => {
    try {
      await itemService.report(id, reason, '');
      setReportOpen(false);
      toast.success('Report submitted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report');
    }
  };

  const handleQR = async () => {
    try {
      const res = await itemService.getQR(id);
      setQrData(res.data);
      setQrOpen(true);
    } catch { toast.error('Failed to generate QR'); }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton variant="card" className="h-96" />
        <Skeleton variant="title" />
        <Skeleton variant="text" count={3} />
      </div>
    );
  }

  if (!item) return <EmptyState type="error" />;

  const images = item.images || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left - Images */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800"
          >
            <img
              src={images[activeImage]?.url || images[activeImage]?.image_url || 'https://placehold.co/800x600/6366f1/fff?text=No+Image'}
              alt={item.title}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4"><StatusBadge status={item.status} /></div>
          </motion.div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i ? 'border-primary-500 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url || img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="glass-card p-6 mt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <HiOutlineChatAlt2 /> Comments ({comments.length})
            </h3>

            {user && (
              <div className="flex gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  {replyTo && (
                    <div className="text-xs text-primary-500 mb-1 flex items-center gap-1">
                      Replying... <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                      placeholder="Write a comment..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white"
                    />
                    <Button size="sm" onClick={handleComment}>Send</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {comment.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{comment.user_name}</span>
                        <span className="text-xs text-slate-400">{format(new Date(comment.created_at), 'MMM d')}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{comment.content}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {user && (
                          <button onClick={() => { setReplyTo(comment.id); }} className="text-xs text-primary-500 hover:text-primary-600">Reply</button>
                        )}
                        {user && (user.id === comment.user_id || user.role === 'admin') && (
                          <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-rose-400 hover:text-rose-500">Delete</button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Replies */}
                  {comment.replies?.map(reply => (
                    <div key={reply.id} className="flex gap-3 ml-11">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-300 to-purple-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {reply.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{reply.user_name}</span>
                          <span className="text-xs text-slate-400">{format(new Date(reply.created_at), 'MMM d')}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No comments yet. Be the first!</p>}
            </div>
          </div>
        </div>

        {/* Right - Details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">{item.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {item.category && <Badge variant="primary">{item.category}</Badge>}
                  {item.color && <Badge>{item.color}</Badge>}
                  {item.brand && <Badge variant="accent">{item.brand}</Badge>}
                </div>
              </div>
            </div>

            {item.description && (
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.description}</p>
            )}

            {/* Meta */}
            <div className="space-y-3 text-sm">
              {item.location_found && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <HiOutlineLocationMarker className="text-primary-500 flex-shrink-0" size={18} />
                  {item.location_found}
                </div>
              )}
              {item.date_found && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <HiOutlineCalendar className="text-primary-500 flex-shrink-0" size={18} />
                  Found on {format(new Date(item.date_found), 'MMMM d, yyyy')}
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <HiOutlineEye className="text-primary-500 flex-shrink-0" size={18} />
                {item.views_count} views
              </div>
              {item.reward_info && (
                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-700 dark:text-amber-300 font-medium">🎁 Reward: {item.reward_info}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant={liked ? 'danger' : 'secondary'} size="sm" onClick={handleLike} icon={liked ? <HiHeart /> : <HiOutlineHeart />}>
                {likesCount}
              </Button>
              <Button variant={bookmarked ? 'primary' : 'secondary'} size="sm" onClick={handleBookmark} icon={bookmarked ? <HiBookmark /> : <HiOutlineBookmark />}>
                Save
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)} icon={<HiOutlineShare />}>Share</Button>
              <Button variant="secondary" size="sm" onClick={handleQR} icon={<HiOutlineQrcode />}>QR</Button>
              {user && user.id !== item.user_id && (
                <Button variant="secondary" size="sm" onClick={() => setReportOpen(true)} icon={<HiOutlineFlag />}>Report</Button>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📇 Finder Information</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {item.user_avatar ? <img src={item.user_avatar} alt="" className="w-full h-full object-cover" /> : item.user_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{item.user_name}</p>
                <p className="text-xs text-slate-500">Posted {format(new Date(item.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>

            <div className="space-y-2">
              {item.phone && !item.hide_contact && (
                <a href={`tel:${item.phone}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors text-sm font-medium">
                  <HiOutlinePhone size={18} /> {item.phone}
                </a>
              )}
              {item.email && !item.hide_contact && (
                <a href={`mailto:${item.email}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors text-sm font-medium">
                  <HiOutlineMail size={18} /> {item.email}
                </a>
              )}
              {item.phone && !item.hide_contact && (
                <a href={`https://wa.me/${item.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 transition-colors text-sm font-medium">
                  💬 WhatsApp
                </a>
              )}
            </div>

            {/* Claim Button */}
            {user && user.id !== item.user_id && item.status === 'found' && (
              <Button variant="gradient" size="lg" className="w-full mt-4" onClick={() => setClaimOpen(true)}>
                🙋 I Think This Is Mine
              </Button>
            )}

            {user && user.id !== item.user_id && (
              <Link to={`/messages?to=${item.user_id}&item=${item.id}`}>
                <Button variant="secondary" size="lg" className="w-full mt-2" icon={<HiOutlineChatAlt2 />}>
                  Message Finder
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} itemId={item.id} itemTitle={item.title} />

      <Modal isOpen={claimOpen} onClose={() => setClaimOpen(false)} title="Submit Claim Request">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Tell the finder why you think this item belongs to you.</p>
          <Input label="Reason *" placeholder="e.g., I lost my black wallet at Central Park on Friday" value={claimForm.reason} onChange={(e) => setClaimForm({ ...claimForm, reason: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Additional Details</label>
            <textarea rows={3} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white resize-none" placeholder="Any additional information..." value={claimForm.description} onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })} />
          </div>
          <Button variant="gradient" className="w-full" onClick={handleClaim}>Submit Claim</Button>
        </div>
      </Modal>

      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report Item" size="sm">
        <div className="space-y-2">
          {['Fake listing', 'Inappropriate content', 'Scam', 'Duplicate', 'Other'].map(reason => (
            <button key={reason} onClick={() => handleReport(reason)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 transition-colors">
              {reason}
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={qrOpen} onClose={() => setQrOpen(false)} title="QR Code" size="sm">
        {qrData && (
          <div className="text-center space-y-4">
            <img src={qrData.qr} alt="QR Code" className="mx-auto w-48 h-48" />
            <p className="text-xs text-slate-500 break-all">{qrData.url}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
