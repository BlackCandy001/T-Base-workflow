import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { DecisionNodeData } from '../types';

export default function DecisionNode({ data }: NodeProps<Node<DecisionNodeData>>) {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 group">
      {/* Diamond Shape */}
      <div className={`absolute inset-0 bg-yellow-500/10 border-2 transform rotate-45 rounded-md pointer-events-none transition-colors ${data.isBottleneck ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-yellow-600/60 group-hover:border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]'}`} />
      
      {/* Content */}
      <div className="z-10 text-center px-2 pointer-events-none max-w-full">
        <div className="text-xs font-bold text-yellow-500 mb-0.5">{data.label || 'Decision'}</div>
        {data.description && <div className="text-[9px] text-gray-400 text-ellipsis overflow-hidden whitespace-nowrap">{data.description}</div>}
      </div>

      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-400 border-2 border-gray-900" />
      
      {/* True output on the right */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="true" 
        className="w-3 h-3 bg-emerald-500 border-2 border-gray-900 -mr-1.5" 
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 text-[10px] font-bold text-emerald-500 pointer-events-none">True</div>

      {/* False output on the bottom */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false" 
        className="w-3 h-3 bg-red-500 border-2 border-gray-900 -mb-1.5" 
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 text-[10px] font-bold text-red-500 pointer-events-none">False</div>
    </div>
  );
}
