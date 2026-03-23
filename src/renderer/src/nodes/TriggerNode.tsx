import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { TriggerNodeData } from '../types';
import { Play } from 'lucide-react';

export default function TriggerNode({ data }: NodeProps<Node<TriggerNodeData>>) {
  return (
    <div className="bg-gray-800 border-2 border-orange-500/50 rounded-full shadow-lg min-w-[120px] text-gray-200 group hover:border-orange-500 transition-colors flex items-center gap-3 px-4 py-3">
      <div className="bg-orange-500/20 p-2 rounded-full">
        <Play size={16} className="text-orange-500" fill="currentColor" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-gray-200">{data.label || 'Trigger'}</span>
        <span className="text-[10px] font-medium text-orange-400 capitalize">{data.type || 'Manual'}</span>
      </div>
      
      {/* Triggers only output */}
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-400 border-2 border-gray-800" />
    </div>
  );
}
