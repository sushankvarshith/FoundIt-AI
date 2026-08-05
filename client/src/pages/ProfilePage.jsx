import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { HiOutlineCamera, HiOutlinePencil, HiOutlineLockClosed, HiOutlineSun, HiOutlineMoon, HiOutlineUpload, HiOutlineCheckCircle, HiOutlineHeart } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/services';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function AnimatedNumber({ value }) {
  const nodeRef = useRef(null);
  const isInView = useInView(nodeRef, { once: true });
  
  useEffect(() => {
    if (!isInView || !nodeRef.current) return;
    const numericValue = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, ''));
    if (isNaN(numericValue)) {
      nodeRef.current.textContent = value;
      return;
    }
    const suffix = String(value).replace(/[0-9]/g, '');
    let startTime;
    const duration = 1500;
    
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

export default function ProfilePage() {
  const { user, updateUser, fetchUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authService.getMe();
      setProfile(res.data);
    } catch {}
  };

  const handleEditProfile = async () => {
    setLoading(true);
    try {
      const res = await authService.updateProfile(editForm);
      updateUser(res.data);
      setEditOpen(false);
      toast.success('Profile updated!');
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword.length < 6) return toast.error('Min 6 characters');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords don\'t match');
    setLoading(true);
    try {
      await authService.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await authService.updateAvatar(formData);
      updateUser({ avatar_url: res.data.avatar_url });
      toast.success('Avatar updated!');
      loadProfile();
    } catch {
      toast.error('Upload failed');
    }
  };

  const data = profile || user;
  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile Card */}
        <div className="glass-card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-xl shadow-primary-500/20">
                {data.avatar_url ? (
                  <img src={data.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  data.name?.charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <HiOutlineCamera className="text-white" size={24} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">{data.name}</h1>
              <p className="text-slate-500 dark:text-slate-400">{data.email}</p>
              <p className="text-xs text-slate-400 mt-1">Member since {format(new Date(data.created_at), 'MMMM yyyy')}</p>
            </div>

            <Button variant="secondary" size="sm" icon={<HiOutlinePencil />} onClick={() => { setEditForm({ name: data.name, email: data.email }); setEditOpen(true); }}>
              Edit
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: <HiOutlineUpload className="text-primary-500" size={24} />, value: data.uploads_count || 0, label: 'Uploads' },
            { icon: <HiOutlineCheckCircle className="text-emerald-500" size={24} />, value: data.returned_count || 0, label: 'Returned' },
            { icon: <HiOutlineHeart className="text-rose-500" size={24} />, value: data.likes_received || 0, label: 'Likes Received' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 text-center"
            >
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedNumber value={stat.value} />
              </div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Settings */}
        <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800">
          <button onClick={() => { setEditForm({ name: data.name, email: data.email }); setEditOpen(true); }} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <HiOutlinePencil className="text-slate-400" size={20} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Edit Profile</span>
            </div>
            <span className="text-slate-400">→</span>
          </button>

          <button onClick={() => setPasswordOpen(true)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <HiOutlineLockClosed className="text-slate-400" size={20} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Change Password</span>
            </div>
            <span className="text-slate-400">→</span>
          </button>

          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              {isDark ? <HiOutlineSun className="text-amber-400" size={20} /> : <HiOutlineMoon className="text-slate-400" size={20} />}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</span>
            </div>
            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isDark ? 'bg-primary-500' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isDark ? 'translate-x-5' : ''}`} />
            </div>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="mt-10 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/10">
          <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button 
            onClick={() => toast.error('Account deletion is disabled in the demo')}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-sm font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="sm">
        <div className="space-y-4">
          <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <Button variant="gradient" className="w-full" onClick={handleEditProfile} loading={loading}>Save Changes</Button>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change Password" size="sm">
        <div className="space-y-4">
          <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
          <Button variant="gradient" className="w-full" onClick={handleChangePassword} loading={loading}>Update Password</Button>
        </div>
      </Modal>
    </div>
  );
}
