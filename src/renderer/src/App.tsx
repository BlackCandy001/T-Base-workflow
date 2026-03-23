import React, { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Sidebar from './components/Sidebar';
import WorkflowCanvas from './components/WorkflowCanvas';
import Topbar from './components/Topbar';
import Settings from './components/Settings';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';
import { WorkflowProvider } from './contexts/WorkflowContext';
import AiAssistant from './features/AiAssistant/App';
import AccountManager from './features/AiAssistant/components/SettingsPanel/AccountManager';
import { SettingsProvider } from './features/AiAssistant/context/SettingsContext';

function MainApp(): React.JSX.Element {
  const [activePage, setActivePage] = useState<'home' | 'settings' | 'login'>('home');
  const [showAi, setShowAi] = useState(false);
  const { theme, t } = usePreferences();

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Topbar activePage={activePage} onNavigate={setActivePage} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <div className={`flex flex-1 overflow-hidden ${activePage === 'home' ? '' : 'hidden'}`}>
          <Sidebar onToggleAi={() => setShowAi(!showAi)} isAiOpen={showAi} />
          <div className="flex-1 relative overflow-hidden flex">
            <WorkflowCanvas />
            
            {/* AI Panel */}
            <div className={`h-full border-l border-gray-200 dark:border-gray-800 transition-all duration-300 overflow-hidden flex flex-col min-h-0 ${showAi ? 'w-80' : 'w-0'}`}>
               <div className="w-80 h-full flex flex-col">
                  <AiAssistant />
               </div>
            </div>
          </div>
        </div>

        {activePage === 'settings' && <Settings />}

        {activePage === 'login' && (
          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 transition-colors p-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl p-8">
              <div style={{ marginBottom: '24px' }}>
                <h2 className="text-3xl font-bold mb-2">AI Account Management</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Connect and manage your AI providers. These accounts are used by the AI Assistant.
                </p>
              </div>
              <AccountManager />
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => setActivePage('home')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  Back to {t('home')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App(): React.JSX.Element {
  return (
    <PreferencesProvider>
      <SettingsProvider>
        <ReactFlowProvider>
          <WorkflowProvider>
            <MainApp />
          </WorkflowProvider>
        </ReactFlowProvider>
      </SettingsProvider>
    </PreferencesProvider>
  );
}
