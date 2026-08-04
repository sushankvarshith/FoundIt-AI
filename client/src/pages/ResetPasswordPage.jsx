import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineLockClosed } from 'react-icons/hi';
import { authService } from '../services/services';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords don\'t match');
    setLoading(true);
    try {
      await authService.resetPassword(token, form.password);
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">Reset Password</h1>
            <p className="text-sm text-slate-500">Enter your new password</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="New Password" type="password" placeholder="Min 6 characters" icon={<HiOutlineLockClosed />} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Input label="Confirm Password" type="password" placeholder="Re-enter password" icon={<HiOutlineLockClosed />} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">Reset Password</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
