import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { bookmarkService } from '../services/services';
import ItemCard from '../components/items/ItemCard';
import { ItemGridSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function BookmarksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookmarkService.getAll()
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-8">🔖 Bookmarks</h1>
        {loading ? <ItemGridSkeleton count={4} /> : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        ) : (
          <EmptyState type="noBookmarks" action={<Link to="/"><Button variant="gradient">Browse Items</Button></Link>} />
        )}
      </motion.div>
    </div>
  );
}
