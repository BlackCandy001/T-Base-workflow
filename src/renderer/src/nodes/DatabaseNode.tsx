import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { DatabaseNodeData } from '../types';
import { Database } from 'lucide-react';

export default function DatabaseNode({ data }: NodeProps<Node<DatabaseNodeData>>) {
  return (
    <div className="bg-gray-800 border-t-4 border-t-pink-500 rounded-xl shadow-lg min-w-[180px] text-gray-200 pointer-events-auto hover:shadow-pink-500/10 transition-shadow">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-500 border-2 border-gray-900" />
      
      <div className="p-3 flex items-center gap-3">
        <div className="bg-pink-500/20 p-2 rounded-lg"><Database size={16} className="text-pink-400" /></div>
        <div className="flex flex-col truncate flex-1">
          <span className="text-xs font-bold text-gray-200 truncate">{data.label || 'Database'}</span>
          <div className="text-[10px] text-gray-400 mt-0.5 truncate uppercase font-bold text-pink-500/80">{data.action || 'READ'}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-pink-500 border-2 border-gray-900" />
    </div>
  );
}
