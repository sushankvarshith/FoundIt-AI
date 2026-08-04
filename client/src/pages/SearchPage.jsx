import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePhotograph, HiOutlineSearch, HiOutlineFilter, HiOutlineX } from 'react-icons/hi';
import { searchService, itemService } from '../services/services';
import ItemCard from '../components/items/ItemCard';
import { ItemGridSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const categories = ['Phone', 'Wallet', 'Keys', 'ID Card', 'Bag', 'Watch', 'Laptop', 'Headphones', 'Bottle', 'Other'];
const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Brown', 'Silver', 'Gold', 'Pink', 'Other'];

export default function SearchPage() {
  const [mode, setMode] = useState('image'); // 'image' or 'text'
  const [searchImage, setSearchImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ q: '', category: '', location: '', color: '', brand: '' });

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSearchImage(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleImageSearch = async () => {
    if (!searchImage) return toast.error('Please upload an image');
    setLoading(true);
    setSearched(true);
    try {
      const formData = new FormData();
      formData.append('image', searchImage);
      const res = await searchService.imageSearch(formData);
      setResults(res.data.results);
      if (res.data.results.length === 0) {
        toast('No similar items found. Try a different image.', { icon: '🔍' });
      } else {
        toast.success(`Found ${res.data.results.length} similar items!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.category) params.category = filters.category;
      if (filters.location) params.location = filters.location;
      if (filters.color) params.color = filters.color;
      if (filters.brand) params.brand = filters.brand;
      const res = await searchService.textSearch(params);
      setResults(res.data.items);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchImage(null);
    setPreview(null);
    setResults([]);
    setSearched(false);
    setFilters({ q: '', category: '', location: '', color: '', brand: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white mb-3">
          🔍 Find Your Lost Item
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Upload a photo of your lost item and our AI will find the closest matches from all uploaded items.
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setMode('image')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === 'image'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <span className="mr-2">📷</span> Image Search
        </button>
        <button
          onClick={() => setMode('text')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === 'text'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <span className="mr-2">🔤</span> Text Search
        </button>
      </div>

      {/* Search Area */}
      <div className="max-w-2xl mx-auto mb-10">
        {mode === 'image' ? (
          <div className="glass-card p-6">
            {!preview ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                    : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/10'
                }`}
              >
                <input {...getInputProps()} />
                <HiOutlinePhotograph className="mx-auto text-5xl text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  {isDragActive ? 'Drop your image here' : 'Upload an image to search'}
                </p>
                <p className="text-sm text-slate-400">
                  Drag & drop or click to browse • JPEG, PNG, WebP • Max 5MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={preview} alt="Search" className="w-full max-h-80 object-contain bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                  <button
                    onClick={() => { setSearchImage(null); setPreview(null); }}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <HiOutlineX size={18} />
                  </button>
                </div>
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  onClick={handleImageSearch}
                  loading={loading}
                  icon={<HiOutlineSearch />}
                >
                  {loading ? 'AI is searching...' : 'Find Similar Items'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by keyword..."
                  icon={<HiOutlineSearch />}
                  value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                icon={<HiOutlineFilter />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <select
                      className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                      className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      value={filters.color}
                      onChange={(e) => setFilters({ ...filters, color: e.target.value })}
                    >
                      <option value="">All Colors</option>
                      {colors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Input
                      placeholder="Location..."
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                    <Input
                      placeholder="Brand..."
                      value={filters.brand}
                      onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={handleTextSearch}
              loading={loading}
              icon={<HiOutlineSearch />}
            >
              Search
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <ItemGridSkeleton count={6} />
      ) : searched && results.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              {mode === 'image' ? `🎯 ${results.length} Similar Items Found` : `📋 ${results.length} Results`}
            </h2>
            <Button variant="ghost" size="sm" onClick={clearSearch}>Clear</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                similarity={mode === 'image' ? item.similarity : null}
              />
            ))}
          </div>
        </div>
      ) : searched ? (
        <EmptyState type="noResults" action={<Button variant="secondary" onClick={clearSearch}>Try Again</Button>} />
      ) : null}
    </div>
  );
}
