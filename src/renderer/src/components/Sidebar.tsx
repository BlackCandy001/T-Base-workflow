import React, { useState } from 'react';
import { Info, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { getSidebarCategories } from '../config/sidebarCategories';

interface SidebarProps {
  onToggleAi?: () => void;
  isAiOpen?: boolean;
}

export default function Sidebar({ onToggleAi, isAiOpen }: SidebarProps) {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<number, boolean>>({});
  const { t, language } = usePreferences();

  const toggleCategory = (idx: number) => {
    setCollapsedCategories(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = getSidebarCategories(t);

  return (
    <aside className="w-68 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shadow-2xl z-10 relative transition-colors shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/20 transition-colors">
        <h1 className="text-lg font-black text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 tracking-tight">T-Base React Flow</h1>
        <p className="text-xs text-gray-500 mt-1">Drag and drop unified nodes</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {categories.map((category, idx) => {
          const isCollapsed = collapsedCategories[idx];
          
          return (
            <div key={idx} className="mb-4">
              <button 
                onClick={() => toggleCategory(idx)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                type="button"
              >
                <span>{category.title}</span>
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>
              
              {!isCollapsed && (
                <div className="flex flex-col gap-1.5">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const isInfoActive = activeInfo === item.type;
                    
                    return (
                      <div 
                        key={item.type}
                        className={`flex flex-col p-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700/50 cursor-grab active:cursor-grabbing hover:bg-white dark:hover:bg-gray-800 ${item.border} transition-all group`}
                        onDragStart={(event) => onDragStart(event, item.type)}
                        draggable
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon size={16} className={`${item.color} group-hover:scale-110 transition-transform`} />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{item.label}</span>
                          </div>
                          
                          <button 
                            type="button"
                            title="Xem tài liệu chức năng"
                            onMouseDown={(e) => { e.stopPropagation(); }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInfo(isInfoActive ? null : item.type);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isInfoActive ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'}`}
                          >
                            <Info size={14} />
                          </button>
                        </div>

                        {isInfoActive && (
                          <div 
                            className="mt-3 p-2.5 bg-white dark:bg-gray-950/60 border border-gray-200 dark:border-gray-700/30 rounded-lg text-left cursor-default select-text"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="mb-2">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mb-0.5">{t('function')}</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed block">{item.desc[language as 'vi' | 'en']}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">{t('example')}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 italic block">{item.ex[language as 'vi' | 'en']}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/10 transition-colors">
        <button
          onClick={onToggleAi}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all shadow-sm ${
            isAiOpen 
              ? 'bg-blue-600 text-white shadow-blue-500/20' 
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <MessageSquare size={18} className={isAiOpen ? 'text-white' : 'text-blue-500'} />
          <span className="text-sm font-semibold">Zen Assistant</span>
          {isAiOpen && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          )}
        </button>
      </div>
    </aside>
  );
}
