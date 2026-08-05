import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiHeart, HiOutlineChatAlt2, HiOutlineShare, HiOutlineEye, HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineBookmark, HiBookmark } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { itemService } from '../../services/services';
import { SimilarityBadge, StatusBadge } from '../ui/Badge';
import Badge from '../ui/Badge';
import ShareModal from '../share/ShareModal';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function ItemCard({ item, onUpdate, similarity, index = 0 }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(item.is_liked === true || item.is_liked === 'true');
  const [likesCount, setLikesCount] = useState(parseInt(item.likes_count || 0));
  const [bookmarked, setBookmarked] = useState(item.is_bookmarked === true || item.is_bookmarked === 'true');
  const [shareOpen, setShareOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error('Please login to like items');
    try {
      const res = await itemService.toggleLike(item.id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch {
      toast.error('Failed to like item');
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error('Please login to bookmark items');
    try {
      const res = await itemService.toggleBookmark(item.id);
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? 'Bookmarked!' : 'Removed from bookmarks');
    } catch {
      toast.error('Failed to bookmark');
    }
  };

  const primaryImage = item.primary_image ||
    (item.images && item.images[0] && (item.images[0].url || item.images[0].image_url)) ||
    'https://placehold.co/400x300/6366f1/ffffff?text=No+Image';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="glass-card overflow-hidden group cursor-pointer"
      >
        <Link to={`/items/${item.id}`}>
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={primaryImage}
              alt={item.title}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Status badge */}
            <div className="absolute top-3 left-3">
              <StatusBadge status={item.status} />
            </div>

            {/* Similarity badge */}
            {similarity && (
              <div className="absolute top-3 right-3 z-10">
                <SimilarityBadge percentage={similarity} />
              </div>
            )}

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className={`absolute right-3 p-2 rounded-xl bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 z-10 ${similarity ? 'top-12' : 'top-3'}`}
            >
              {bookmarked ? <HiBookmark size={18} /> : <HiOutlineBookmark size={18} />}
            </button>

            {/* Category */}
            {item.category && (
              <div className="absolute bottom-3 left-3">
                <Badge variant="primary" size="xs">{item.category}</Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-tight line-clamp-1 group-hover:text-primary-500 transition-colors">
              {item.title}
            </h3>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {item.location_found && (
                <span className="flex items-center gap-1">
                  <HiOutlineLocationMarker size={14} />
                  <span className="truncate max-w-[120px]">{item.location_found}</span>
                </span>
              )}
              {item.created_at && (
                <span className="flex items-center gap-1">
                  <HiOutlineCalendar size={14} />
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Footer - Stats & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Uploader */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {item.user_avatar ? (
                    <img src={item.user_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (item.user_name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[80px]">
                  {item.user_name || 'Unknown'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                    liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  {liked ? <HiHeart size={16} /> : <HiOutlineHeart size={16} />}
                  <span>{likesCount}</span>
                </button>

                <span className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400">
                  <HiOutlineChatAlt2 size={16} />
                  {item.comments_count || 0}
                </span>

                <span className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400">
                  <HiOutlineEye size={16} />
                  {item.views_count || 0}
                </span>

                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareOpen(true); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-primary-500 transition-colors"
                >
                  <HiOutlineShare size={16} />
                </button>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        itemId={item.id}
        itemTitle={item.title}
      />
    </>
  );
}
