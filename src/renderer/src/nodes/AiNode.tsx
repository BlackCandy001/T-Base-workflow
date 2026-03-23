import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { AiNodeData } from '../types';
import { Bot } from 'lucide-react';

export default function AiNode({ data }: NodeProps<Node<AiNodeData>>) {
  return (
    <div className="bg-gray-800 border border-fuchsia-500/50 rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.15)] min-w-[200px] text-gray-200 pointer-events-auto relative overflow-hidden group hover:border-fuchsia-400 transition-colors">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-fuchsia-500 border-2 border-gray-900" />
      
      <div className="p-3 flex items-start gap-3 mt-1">
        <div className="bg-fuchsia-500/20 p-2 rounded-lg group-hover:bg-fuchsia-500/30 transition-colors"><Bot size={16} className="text-fuchsia-400" /></div>
        <div className="flex flex-col flex-1 w-full">
          <span className="text-xs font-bold text-gray-200">{data.label || 'AI Task'}</span>
          <div className="text-[10px] text-fuchsia-400 mt-1 font-mono bg-fuchsia-950/50 inline-block px-1.5 py-0.5 rounded w-fit border border-fuchsia-500/30">{data.model || 'gpt-4'}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-fuchsia-500 border-2 border-gray-900" />
    </div>
  );
}
