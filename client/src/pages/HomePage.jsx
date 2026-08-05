import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { HiOutlineSearch, HiOutlineUpload, HiOutlinePhotograph, HiOutlineArrowRight, HiOutlineSparkles, HiOutlineRefresh } from 'react-icons/hi';
import { itemService } from '../services/services';
import ItemCard from '../components/items/ItemCard';
import { ItemGridSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useInfiniteScroll } from '../hooks/useHooks';

const categories = [
  { name: 'Phone', icon: '📱' },
  { name: 'Wallet', icon: '👛' },
  { name: 'Keys', icon: '🔑' },
  { name: 'ID Card', icon: '🪪' },
  { name: 'Bag', icon: '🎒' },
  { name: 'Watch', icon: '⌚' },
  { name: 'Laptop', icon: '💻' },
  { name: 'Headphones', icon: '🎧' },
  { name: 'Bottle', icon: '💧' },
  { name: 'Other', icon: '📦' },
];

function AnimatedNumber({ value }) {
  const nodeRef = useRef(null);
  const isInView = useInView(nodeRef, { once: true });
  
  useEffect(() => {
    if (!isInView || !nodeRef.current) return;
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    const suffix = value.replace(/[0-9]/g, '');
    let startTime;
    const duration = 2000;
    
    const updateCount = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      if (nodeRef.current) {
        nodeRef.current.textContent = Math.floor(ease * numericValue) + suffix;
      }
      if (progress < 1) requestAnimationFrame(updateCount);
    };
    requestAnimationFrame(updateCount);
  }, [value, isInView]);
  
  return <span ref={nodeRef}>0</span>;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [trending, setTrending] = useState([]);
  const [returned, setReturned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');

  const fetchItems = useCallback(async (pageNum = 1, category = '') => {
    try {
      const params = { page: pageNum, limit: 12 };
      if (category) params.category = category;
      const res = await itemService.getAll(params);
      if (pageNum === 1) {
        setItems(res.data.items);
      } else {
        setItems(prev => [...prev, ...res.data.items]);
      }
      setHasMore(pageNum < res.data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchItems(1, activeCategory);
  }, [activeCategory, fetchItems]);

  useEffect(() => {
    // Fetch trending and returned
    Promise.all([
      itemService.getTrending().catch(() => ({ data: [] })),
      itemService.getRecentReturned().catch(() => ({ data: [] })),
    ]).then(([trendingRes, returnedRes]) => {
      setTrending(trendingRes.data);
      setReturned(returnedRes.data);
    });
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage, activeCategory);
  }, [page, activeCategory, fetchItems]);

  const lastItemRef = useInfiniteScroll(loadMore, hasMore);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="gradient-bg-animated min-h-[60vh] flex items-center">
          {/* Dot pattern overlay */}
          <div className="absolute inset-0 dot-pattern opacity-30" />

          {/* Floating shapes */}
          <motion.div
            animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-20 left-10 w-20 h-20 rounded-2xl bg-white/10 blur-sm hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-white/10 blur-sm hidden lg:block"
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium mb-6">
                <HiOutlineSparkles className="text-amber-300" />
                AI-Powered Visual Search
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 font-display leading-tight">
                Lost Something?
                <br />
                <span className="text-white/80">Let AI Find It.</span>
              </h1>

              <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10">
                Upload a photo of your lost item and our AI will scan thousands of found items
                to find the closest match. Reconnect with your belongings in seconds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="xl"
                  variant="secondary"
                  icon={<HiOutlinePhotograph />}
                  onClick={() => navigate('/search')}
                  className="!bg-white !text-primary-600 hover:!bg-white/90 !border-none !shadow-2xl min-w-[200px]"
                >
                  Search by Image
                </Button>
                {user ? (
                  <Button
                    size="xl"
                    variant="ghost"
                    icon={<HiOutlineUpload />}
                    onClick={() => navigate('/upload')}
                    className="!text-white !border-white/30 hover:!bg-white/10 min-w-[200px]"
                  >
                    Upload Found Item
                  </Button>
                ) : (
                  <Button
                    size="xl"
                    variant="ghost"
                    onClick={() => navigate('/register')}
                    className="!text-white !border-white/30 hover:!bg-white/10 min-w-[200px]"
                    iconRight={<HiOutlineArrowRight />}
                  >
                    Get Started Free
                  </Button>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-8 mt-12">
                {[
                  { label: 'Items Found', value: '1K+' },
                  { label: 'Reunited', value: '500+' },
                  { label: 'AI Accuracy', value: '95%' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      <AnimatedNumber value={stat.value} />
                    </div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full h-auto fill-slate-50 dark:fill-[#0b1120]">
            <path d="M0,64 C480,0 960,0 1440,64 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '📸', title: 'Snap a Photo', desc: 'Take a picture of the item you found or the one you lost.' },
            { icon: '🧠', title: 'AI Matching', desc: 'Our AI instantly analyzes the image and finds visual matches.' },
            { icon: '🤝', title: 'Reconnect', desc: 'Chat securely and reunite the item with its rightful owner.' },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 text-center gradient-border-card"
            >
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-slate-500 dark:text-slate-400">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Category Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              !activeCategory
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <span>✨</span> All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 btn-ripple ${
                activeCategory === cat.name
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Trending Section */}
      {trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              🔥 Trending This Week
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {trending.slice(0, 4).map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Main Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            📋 Recently Found Items
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<HiOutlineRefresh />}
            onClick={() => { setPage(1); setLoading(true); fetchItems(1, activeCategory); }}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <ItemGridSkeleton count={6} />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((item, index) => (
              <div
                key={item.id}
                ref={index === items.length - 1 ? lastItemRef : null}
              >
                <ItemCard item={item} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            type="noItems"
            action={
              user ? (
                <Link to="/upload">
                  <Button variant="gradient" icon={<HiOutlineUpload />}>Upload First Item</Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button variant="gradient">Get Started</Button>
                </Link>
              )
            }
          />
        )}

        {/* Loading more indicator */}
        {!loading && hasMore && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full" />
          </div>
        )}
      </section>

      {/* Recently Returned */}
      {returned.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            ✅ Recently Returned
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {returned.slice(0, 4).map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white">Happy Reunions</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Sarah M.', item: 'Lost Keys', text: 'I found my keys within hours! The AI matched them perfectly.', rating: '⭐⭐⭐⭐⭐' },
            { name: 'David L.', item: 'Found Laptop', text: 'Super easy to upload what I found. The owner contacted me next day.', rating: '⭐⭐⭐⭐⭐' },
            { name: 'Emma K.', item: 'Lost Wallet', text: 'A lifesaver! Someone found my wallet and the visual search worked like magic.', rating: '⭐⭐⭐⭐⭐' },
          ].map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card p-6">
              <div className="text-sm mb-4">{t.rating}</div>
              <p className="text-slate-700 dark:text-slate-300 italic mb-4">"{t.text}"</p>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="font-semibold text-slate-900 dark:text-white text-sm">{t.name}</span>
                <span className="text-xs text-primary-500 font-medium">{t.item}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="glass-card p-8 sm:p-12 text-center relative overflow-hidden gradient-border-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white mb-4">
              Found Something? Help Someone Today!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-lg mx-auto">
              Upload the item you found and our AI will help match it with someone who&apos;s looking.
            </p>
            <Link to={user ? '/upload' : '/register'}>
              <Button size="lg" variant="gradient" icon={<HiOutlineUpload />}>
                {user ? 'Upload Now' : 'Get Started'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
