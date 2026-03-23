import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { ApiNodeData } from '../types';
import { Globe } from 'lucide-react';

export default function ApiNode({ data }: NodeProps<Node<ApiNodeData>>) {
  const methodColors: Record<string, string> = {
    GET: 'text-blue-400',
    POST: 'text-green-400',
    PUT: 'text-yellow-400',
    DELETE: 'text-red-400'
  };

  const currentMethod = data.method || 'GET';

  return (
    <div className="bg-gray-800 border-t-4 border-t-cyan-500 rounded-xl shadow-lg min-w-[220px] max-w-[260px] text-gray-200 p-0 overflow-hidden pointer-events-auto">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-cyan-500 border-2 border-gray-900" />
      
      <div className="p-3 bg-gray-800 flex items-center gap-3">
        <div className="bg-cyan-500/20 p-2 rounded-lg"><Globe size={18} className="text-cyan-400" /></div>
        <div className="flex flex-col flex-1 truncate">
          <span className="text-xs font-bold text-gray-200 truncate">{data.label || 'HTTP Request'}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[9px] font-bold ${methodColors[currentMethod]}`}>{currentMethod}</span>
            <span className="text-[10px] text-gray-400 truncate flex-1" title={data.url}>{data.url || 'https://domain.com'}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-cyan-500 border-2 border-gray-900" />
    </div>
  );
}
