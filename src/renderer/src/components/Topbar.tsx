import { Home, Settings as SettingsIcon, LogIn } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

interface TopbarProps {
  activePage: string;
  onNavigate: (page: 'home' | 'settings' | 'login') => void;
}

export default function Topbar({ activePage, onNavigate }: TopbarProps) {
  const { t } = usePreferences();

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 z-20 relative shadow-xs dark:shadow-md shrink-0 transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          TB
        </div>
        <span className="font-black text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 tracking-tight text-lg ml-2">
          T-Base Workflow
        </span>
      </div>

      <nav className="flex items-center gap-2">
        <button 
          onClick={() => onNavigate('home')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activePage === 'home' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
        >
          <Home size={16} />
          {t('home')}
        </button>
        <button 
          onClick={() => onNavigate('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activePage === 'settings' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
        >
          <SettingsIcon size={16} />
          {t('settings')}
        </button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-2" />
        <button 
          onClick={() => onNavigate('login')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activePage === 'login' ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/50' : 'text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:border-blue-500/30'}`}
        >
          <LogIn size={16} />
          {t('login')}
        </button>
      </nav>
    </header>
  );
}
