import { AppNode } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';

interface NodeEditorProps {
  node: AppNode | null;
  onUpdate: (id: string, data: any) => void;
  onClose?: () => void;
}

export default function NodeEditor({ node, onUpdate, onClose }: NodeEditorProps) {
  const { t } = usePreferences();

  if (!node) {
    return (
      <aside className="w-[300px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center shadow-2xl absolute right-0 top-0 h-full z-10 transition-colors">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700/50">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-gray-700 dark:text-gray-400 font-medium">{t('no_node_selected')}</h3>
        <p className="text-sm text-gray-500 mt-2">{t('node_select_desc')}</p>
      </aside>
    );
  }

  const handleDataChange = (key: string, value: any) => {
    onUpdate(node.id, { ...node.data, [key]: value });
  };

  const renderField = (label: string, value: any, type: string, key: string, options?: any[]) => {
    return (
      <div className="mb-4" key={key}>
        <label className="block tracking-wide text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">{label}</label>
        {type === 'select' ? (
          <select 
            value={value} 
            onChange={(e) => handleDataChange(key, e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          >
            {options?.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
          </select>
        ) : type === 'textarea' ? (
           <textarea 
            value={value} 
            onChange={(e) => handleDataChange(key, e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[100px] resize-y"
          />
        ) : type === 'checkbox' ? (
           <input 
            type="checkbox"
            checked={!!value} 
            onChange={(e) => handleDataChange(key, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-500 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          />
        ) : (
          <input 
            type={type} 
            value={value !== undefined ? value : ''} 
            onChange={(e) => handleDataChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
          />
        )}
      </div>
    );
  };

  return (
    <aside className="w-[300px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full shadow-2xl absolute right-0 top-0 z-10 transition-colors">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/20 flex items-center justify-between min-h-[72px] transition-colors">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-500/30">
            {node.type}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{node.id}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {/* Base Properties */}
        {node.type !== 'note' && node.type !== 'label' && (
          <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            {renderField('Label', node.data.label, 'text', 'label')}
            {renderField('Description', node.data.description, 'textarea', 'description')}
          </div>
        )}

        <div className="space-y-4">
          {node.type === 'member' && (
            <>
              {renderField('Name', (node.data as any).name, 'text', 'name')}
              {renderField('Role', (node.data as any).role, 'select', 'role', ['Developer', 'Designer', 'Manager'])}
              {renderField('Status', (node.data as any).status, 'select', 'status', ['Idle', 'Working', 'Offline'])}
            </>
          )}

          {node.type === 'task' && (
            <>
              {renderField('Title', (node.data as any).title, 'text', 'title')}
              {renderField('Progress (%)', (node.data as any).progress, 'number', 'progress')}
              {renderField('Deadline', (node.data as any).deadline, 'date', 'deadline')}
            </>
          )}

          {node.type === 'project' && renderField('Project Name', (node.data as any).name, 'text', 'name')}

          {node.type === 'group' && (
            <>
              {renderField('Width', (node.data as any).width, 'number', 'width')}
              {renderField('Height', (node.data as any).height, 'number', 'height')}
            </>
          )}

          {node.type === 'trigger' && renderField('Trigger Type', (node.data as any).type, 'select', 'type', ['manual', 'schedule', 'webhook'])}
          {node.type === 'team' && renderField('Team Name', (node.data as any).teamName, 'text', 'teamName')}

          {node.type === 'loop' && (
            <>
              {renderField('Max Iterations', (node.data as any).maxIterations, 'number', 'maxIterations')}
              {renderField('Break Condition', (node.data as any).breakCondition, 'text', 'breakCondition')}
            </>
          )}

          {node.type === 'delay' && (
            <>
              {renderField('Duration', (node.data as any).duration, 'number', 'duration')}
              {renderField('Unit', (node.data as any).unit, 'select', 'unit', ['seconds', 'minutes', 'hours', 'days'])}
            </>
          )}

          {node.type === 'api' && (
            <>
              {renderField('Method', (node.data as any).method, 'select', 'method', ['GET', 'POST', 'PUT', 'DELETE'])}
              {renderField('Endpoint URL', (node.data as any).url, 'text', 'url')}
            </>
          )}

          {node.type === 'database' && (
            <>
              {renderField('Action', (node.data as any).action, 'select', 'action', ['read', 'write'])}
              {renderField('SQL Query', (node.data as any).query, 'textarea', 'query')}
            </>
          )}

          {node.type === 'file' && (
            <>
               {renderField('Action', (node.data as any).action, 'select', 'action', ['read', 'write', 'delete'])}
               {renderField('File Path', (node.data as any).filePath, 'text', 'filePath')}
            </>
          )}

          {node.type === 'notification' && (
            <>
              {renderField('Channel', (node.data as any).channel, 'select', 'channel', ['email', 'slack', 'in-app'])}
              {renderField('Message', (node.data as any).message, 'textarea', 'message')}
            </>
          )}

          {node.type === 'ai' && (
            <>
              {renderField('Model', (node.data as any).model, 'select', 'model', ['gpt-4', 'gemini', 'claude'])}
              {renderField('Prompt', (node.data as any).prompt, 'textarea', 'prompt')}
            </>
          )}

          {node.type === 'progress' && renderField('Measurement Style', (node.data as any).measurementStyle, 'select', 'measurementStyle', ['percentage', 'fraction'])}
          {node.type === 'calculation' && renderField('Expression', (node.data as any).expression, 'text', 'expression')}

          {node.type === 'note' && (
             <>
               {renderField('Notepad Title', node.data.label, 'text', 'label')}
               {renderField('Content', (node.data as any).content, 'textarea', 'content')}
             </>
          )}

          {node.type === 'label' && (
             <>
               {renderField('Text', (node.data as any).text, 'text', 'text')}
               {renderField('Font Size', (node.data as any).size, 'select', 'size', ['small', 'medium', 'large'])}
             </>
          )}

          {node.type === 'permission' && (
             <div className="mb-4">
               <label className="block tracking-wide text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Required Roles (comma separated)</label>
               <input 
                 type="text" 
                 value={((node.data as any).requiredRoles || []).join(', ')} 
                 onChange={(e) => handleDataChange('requiredRoles', e.target.value.split(',').map(r => r.trim()))}
                 className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
               />
             </div>
          )}

          {node.type === 'config' && (
             <>
               {renderField('Configuration Key', (node.data as any).key, 'text', 'key')}
               {renderField('Value', (node.data as any).value, 'text', 'value')}
               <div className="flex items-center gap-2 mt-2">
                 {renderField('Secure / Secret', (node.data as any).isSecure, 'checkbox', 'isSecure')}
               </div>
             </>
          )}
        </div>
      </div>
    </aside>
  );
}
