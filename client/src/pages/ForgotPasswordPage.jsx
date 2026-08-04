import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail } from 'react-icons/hi';
import { authService } from '../services/services';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-8 sm:p-10">
          {sent ? (
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">Check Your Email</h1>
              <p className="text-sm text-slate-500 mb-6">If an account exists for {email}, we&apos;ve sent a reset link.</p>
              <Link to="/login"><Button variant="secondary">Back to Login</Button></Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🔑</div>
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">Forgot Password?</h1>
                <p className="text-sm text-slate-500">Enter your email and we&apos;ll send a reset link</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input label="Email" type="email" placeholder="you@example.com" icon={<HiOutlineMail />} value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">Send Reset Link</Button>
              </form>
              <p className="text-center text-sm text-slate-500 mt-6">
                Remember your password? <Link to="/login" className="text-primary-500 font-semibold">Sign In</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
