import { forwardRef, useState } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';

const Input = forwardRef(({
  label, error, icon, type = 'text', className = '', containerClass = '', ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`space-y-1.5 ${containerClass}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={isPassword && showPassword ? 'text' : type}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-white dark:bg-slate-800/50
            border border-slate-200 dark:border-slate-700
            text-slate-900 dark:text-white
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
            transition-all duration-200
            ${icon ? 'pl-11' : ''}
            ${isPassword ? 'pr-11' : ''}
            ${error ? 'border-rose-400 focus:ring-rose-500/50 focus:border-rose-500' : ''}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-rose-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
