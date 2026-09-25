'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 transition-all shadow-2xs text-xs font-semibold"
      aria-label="Alternar modo escuro"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Escuro</span>
        </>
      )}
    </button>
  );
}
