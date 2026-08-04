import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePhotograph, HiOutlineX, HiOutlineCheck, HiOutlineUpload } from 'react-icons/hi';
import { itemService } from '../services/services';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const categories = ['Phone', 'Wallet', 'Keys', 'ID Card', 'Bag', 'Watch', 'Laptop', 'Headphones', 'Bottle', 'Glasses', 'Jewelry', 'Other'];
const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Brown', 'Silver', 'Gold', 'Pink', 'Purple', 'Orange', 'Other'];

export default function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    title: '', description: '', category: '', brand: '', color: '',
    location_found: '', date_found: '', reward_info: '',
    phone: '', email: '', hide_contact: false,
  });

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = [...images, ...acceptedFiles].slice(0, 5);
    setImages(newFiles);
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (images.length === 0) return toast.error('Please upload at least one image');
    if (!form.title.trim()) return toast.error('Title is required');

    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      images.forEach(img => formData.append('images', img));
      Object.entries(form).forEach(([key, val]) => {
        if (val !== '' && val !== undefined) formData.append(key, val);
      });

      setProgress(30);
      const res = await itemService.create(formData);
      setProgress(100);

      toast.success('Item uploaded successfully! 🎉');
      setTimeout(() => navigate(`/items/${res.data.id}`), 500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-2">
            📤 Upload Found Item
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Help someone find their lost belongings
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {step > s ? <HiOutlineCheck size={20} /> : s}
              </div>
              {s < 3 && <div className={`w-12 sm:w-20 h-0.5 ${step > s ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Images */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Upload Images</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Add up to 5 clear photos of the found item</p>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-6 ${
                    isDragActive
                      ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <HiOutlinePhotograph className="mx-auto text-4xl text-slate-300 mb-3" />
                  <p className="font-medium text-slate-700 dark:text-slate-200">Drag & drop images here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse • Max 5 images • 5MB each</p>
                </div>

                {previews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 p-1 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiOutlineX size={14} />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-md font-medium">Primary</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={() => images.length > 0 ? setStep(2) : toast.error('Upload at least one image')} variant="gradient">
                    Next: Item Details
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Item Details</h2>

                <div className="space-y-5">
                  <Input label="Title *" placeholder="e.g., Black iPhone 15 Pro" value={form.title} onChange={(e) => updateForm('title', e.target.value)} />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        value={form.category}
                        onChange={(e) => updateForm('category', e.target.value)}
                      >
                        <option value="">Select...</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Color</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        value={form.color}
                        onChange={(e) => updateForm('color', e.target.value)}
                      >
                        <option value="">Select...</option>
                        {colors.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <Input label="Brand" placeholder="e.g., Apple, Samsung, Nike" value={form.brand} onChange={(e) => updateForm('brand', e.target.value)} />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                    <textarea
                      rows={4}
                      placeholder="Describe the item in detail..."
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                      value={form.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Location Found" placeholder="e.g., Central Park" value={form.location_found} onChange={(e) => updateForm('location_found', e.target.value)} />
                    <Input label="Date Found" type="date" value={form.date_found} onChange={(e) => updateForm('date_found', e.target.value)} />
                  </div>

                  <Input label="Reward Info (optional)" placeholder="e.g., $20 reward" value={form.reward_info} onChange={(e) => updateForm('reward_info', e.target.value)} />
                </div>

                <div className="flex justify-between mt-8">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button variant="gradient" onClick={() => form.title.trim() ? setStep(3) : toast.error('Title is required')}>
                    Next: Contact Info
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Contact */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Contact Information</h2>

                <div className="space-y-5">
                  <Input label="Phone (optional)" type="tel" placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                  <Input label="Email" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hide_contact}
                      onChange={(e) => updateForm('hide_contact', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-primary-500 focus:ring-primary-500/50"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Hide contact info (users will need to send a claim request)
                    </span>
                  </label>
                </div>

                {/* Upload progress */}
                {uploading && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={handleSubmit}
                    loading={uploading}
                    icon={<HiOutlineUpload />}
                  >
                    Upload Item
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
