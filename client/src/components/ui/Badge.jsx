import { motion } from 'framer-motion';

const badgeVariants = {
  default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  danger: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  info: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  accent: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300',
};

export default function Badge({ children, variant = 'default', size = 'sm', icon, className = '', animate = false }) {
  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const Component = animate ? motion.span : 'span';
  const animationProps = animate ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: 'spring' } } : {};

  return (
    <Component
      {...animationProps}
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full
        ${badgeVariants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </Component>
  );
}

// Similarity badge with gradient
export function SimilarityBadge({ percentage }) {
  const getColor = (pct) => {
    if (pct >= 90) return 'from-emerald-400 to-emerald-500';
    if (pct >= 75) return 'from-primary-400 to-primary-500';
    if (pct >= 60) return 'from-amber-400 to-amber-500';
    return 'from-slate-400 to-slate-500';
  };

  return (
    <motion.span
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 400 }}
      className={`
        inline-flex items-center gap-1 px-3 py-1.5 rounded-full
        bg-gradient-to-r ${getColor(percentage)}
        text-white text-xs font-bold shadow-lg
      `}
    >
      <span className="text-white/80">🎯</span>
      {percentage}% Match
    </motion.span>
  );
}

// Status badge for items
export function StatusBadge({ status }) {
  const config = {
    found: { variant: 'info', label: 'Found', icon: '🔍' },
    claimed: { variant: 'warning', label: 'Claimed', icon: '📋' },
    returned: { variant: 'success', label: 'Returned', icon: '✅' },
  };

  const { variant, label, icon } = config[status] || config.found;

  return (
    <Badge variant={variant} icon={icon}>
      {label}
    </Badge>
  );
}
