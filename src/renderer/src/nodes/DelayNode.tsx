import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { DelayNodeData } from '../types';
import { Timer } from 'lucide-react';

export default function DelayNode({ data }: NodeProps<Node<DelayNodeData>>) {
  return (
    <div className="bg-gray-800 border border-amber-500/50 hover:border-amber-500 transition-colors rounded-xl shadow-lg min-w-[140px] text-gray-200 p-2 flex items-center gap-3 pointer-events-auto group">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-gray-900" />
      <div className="bg-amber-500/20 p-2 rounded-lg group-hover:bg-amber-500/30 transition-colors"><Timer size={16} className="text-amber-500" /></div>
      <div className="pr-4">
        <div className="text-xs font-bold text-gray-200">{data.label || 'Delay'}</div>
        <div className="text-[10px] text-amber-500 mt-0.5 font-medium">{data.duration || 0} {data.unit || 'seconds'}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-amber-500 border-2 border-gray-900" />
    </div>
  );
}
