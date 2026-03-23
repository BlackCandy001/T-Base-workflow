import React, { useState } from 'react';
import { Plus, X, Edit2, Check } from 'lucide-react';
import { useWorkflow } from '../contexts/WorkflowContext';

export default function WorkflowTabs() {
  const { workflows, activeId, createWorkflow, deleteWorkflow, switchWorkflow, renameWorkflow } = useWorkflow();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartRename = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(name);
  };

  const handleSaveRename = (id: string) => {
    if (editValue.trim()) {
      renameWorkflow(id, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto custom-scrollbar no-scrollbar-buttons">
      {workflows.map((wf) => (
        <div
          key={wf.id}
          onClick={() => switchWorkflow(wf.id)}
          onDoubleClick={(e) => handleStartRename(wf.id, wf.name, e)}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
            activeId === wf.id 
              ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400' 
              : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {editingId === wf.id ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveRename(wf.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(wf.id)}
                className="bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-500 rounded px-1 py-0.5 text-xs focus:outline-hidden w-24"
              />
              <button 
                onClick={() => handleSaveRename(wf.id)}
                className="text-green-500 hover:text-green-600"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <>
              <span className="truncate max-w-[120px]">{wf.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <button
                  onClick={(e) => handleStartRename(wf.id, wf.name, e)}
                  className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Edit2 size={12} />
                </button>
                {workflows.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorkflow(wf.id);
                    }}
                    className="p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded text-gray-400 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
      
      <button
        onClick={() => createWorkflow()}
        className="ml-2 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all shadow-sm"
        title="Tạo trang Workflow mới"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
