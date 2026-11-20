import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleButtonProps {
  variant?: 'header' | 'surface';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  variant = 'header',
  showLabel = true,
  className = ''
}) => {
  const { isDark, toggleTheme } = useTheme();

  const label = isDark ? 'Modo Claro' : 'Modo Oscuro';
  const title = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  if (variant === 'surface') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={title}
        title={title}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${className}`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <Moon className="w-4 h-4 text-emerald-800 shrink-0" />
        )}
        {showLabel && <span>{label}</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={title}
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-800/90 hover:bg-emerald-700 dark:bg-emerald-900/90 dark:hover:bg-emerald-800 border border-emerald-600/60 dark:border-emerald-700/70 text-xs font-medium text-emerald-100 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <Moon className="w-4 h-4 text-amber-300 shrink-0" />
      )}
      {showLabel && <span className="hidden lg:inline">{label}</span>}
    </button>
  );
};
