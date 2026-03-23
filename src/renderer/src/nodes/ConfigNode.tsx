import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { ConfigNodeData } from '../types';
import { Settings } from 'lucide-react';

export default function ConfigNode({ data }: NodeProps<Node<ConfigNodeData>>) {
  return (
    <div className="bg-gray-800 border-t-4 border-t-slate-400 rounded-xl shadow-lg min-w-[180px] text-gray-200 pointer-events-auto">
      <div className="p-3 flex items-center gap-3">
        <div className="bg-slate-400/20 p-2 rounded-lg"><Settings size={16} className="text-slate-300" /></div>
        <div className="flex flex-col truncate flex-1">
          <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mb-0.5">ENV VAR</span>
          <span className="text-xs font-bold text-gray-200 truncate">{data.key || 'APP_SECRET'}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400 border-2 border-gray-900" />
    </div>
  );
}
