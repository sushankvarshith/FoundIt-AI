import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
  secondary: 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
  ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25',
  accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/25',
  gradient: 'bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white shadow-lg shadow-primary-500/25',
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
