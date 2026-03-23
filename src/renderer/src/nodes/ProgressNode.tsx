import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { ProgressNodeData } from '../types';
import { BarChart2 } from 'lucide-react';

export default function ProgressNode({ data }: NodeProps<Node<ProgressNodeData>>) {
  return (
    <div className="bg-gray-800 border-t-4 border-t-emerald-400 rounded-xl shadow-lg min-w-[180px] text-gray-200 pointer-events-auto">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-400 border-2 border-gray-900" />
      
      <div className="p-3 flex items-center gap-3">
        <div className="bg-emerald-400/20 p-2 rounded-lg"><BarChart2 size={16} className="text-emerald-400" /></div>
        <div className="flex flex-col truncate flex-1">
          <span className="text-xs font-bold text-gray-200">{data.label || 'Track Progress'}</span>
          <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden relative">
            <div className="bg-emerald-500 h-full w-[45%] absolute left-0 top-0" />
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-400 border-2 border-gray-900" />
    </div>
  );
}
