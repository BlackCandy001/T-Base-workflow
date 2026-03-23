import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { LoopNodeData } from '../types';
import { Repeat } from 'lucide-react';

export default function LoopNode({ data }: NodeProps<Node<LoopNodeData>>) {
  return (
    <div className="bg-gray-800 border border-blue-500/50 hover:border-blue-500 transition-colors rounded-xl shadow-lg min-w-[160px] text-gray-200 p-3 text-center relative pointer-events-auto">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-gray-900" />
      
      <div className="flex justify-center mb-2">
        <div className="bg-blue-500/20 p-2 rounded-full"><Repeat size={16} className="text-blue-400" /></div>
      </div>
      <div className="text-xs font-bold text-gray-200">{data.label || 'Loop'}</div>
      <div className="text-[10px] text-blue-400 mt-1 font-mono bg-blue-900/40 rounded px-1.5 py-0.5 inline-block">Max: {data.maxIterations || 10}</div>

      <Handle type="source" position={Position.Right} id="body" className="w-3 h-3 bg-blue-500 border-2 border-gray-900 -mr-1.5" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-7 text-[9px] font-bold text-blue-400 pointer-events-none">Body</div>
      
      <Handle type="source" position={Position.Bottom} id="done" className="w-3 h-3 bg-gray-500 border-2 border-gray-900 -mb-1.5" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 text-[9px] font-bold text-gray-400 pointer-events-none">Done</div>
    </div>
  );
}
