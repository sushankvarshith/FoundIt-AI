import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const variants = {
  primary: 'glass-btn bg-primary-600/40 hover:bg-primary-600/60 text-white shadow-lg shadow-primary-500/25',
  secondary: 'glass-btn bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10',
  ghost: 'bg-transparent hover:bg-white/10 text-slate-200',
  danger: 'glass-btn bg-rose-500/40 hover:bg-rose-500/60 text-white shadow-lg shadow-rose-500/25',
  accent: 'glass-btn bg-accent-500/40 hover:bg-accent-500/60 text-white shadow-lg shadow-accent-500/25',
  gradient: 'bg-gradient-to-r from-primary-500/80 to-purple-500/80 hover:from-primary-600 hover:to-purple-600 text-white shadow-lg shadow-primary-500/25 backdrop-blur-md border border-white/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
  xl: 'px-9 py-4 text-lg rounded-2xl',
  icon: 'p-2.5 rounded-xl',
};

const Button = forwardRef(({
  children, variant = 'primary', size = 'md', loading = false,
  disabled = false, className = '', icon, iconRight, ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-ring
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="text-lg">{icon}</span>
      ) : null}
      {children}
      {iconRight && <span className="text-lg">{iconRight}</span>}
    </motion.button>
  );
});

Button.displayName = 'Button';
export default Button;
