import { usePreferences } from '../contexts/PreferencesContext';
import { Moon, Sun, Languages } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme, language, setLanguage, t } = usePreferences();

  return (
    <div className="flex-1 overflow-y-auto p-10 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-purple-500 tracking-tight">
          {t('app_settings')}
        </h1>

        <div className="space-y-8">
          {/* Theme Setting */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <div>
                <h2 className="text-lg font-bold">Giao diện (Theme)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('theme_desc')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold flex justify-center items-center gap-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'}`}
              >
                <Sun size={18} /> {t('light_mode')}
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold flex justify-center items-center gap-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-gray-800 text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
              >
                <Moon size={18} /> {t('dark_mode')}
              </button>
            </div>
          </div>

          {/* Language Setting */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Languages size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{t('language')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('lang_desc')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <button 
                onClick={() => setLanguage('vi')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${language === 'vi' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
              >
                🇻🇳 Tiếng Việt
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${language === 'en' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
