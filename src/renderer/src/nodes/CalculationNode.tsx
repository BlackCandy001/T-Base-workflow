import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { CalculationNodeData } from '../types';
import { Calculator } from 'lucide-react';

export default function CalculationNode({ data }: NodeProps<Node<CalculationNodeData>>) {
  return (
    <div className="bg-gray-800 border-t-4 border-t-blue-400 rounded-xl shadow-lg min-w-[160px] text-gray-200 pointer-events-auto">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-400 border-2 border-gray-900" />
      
      <div className="p-3 flex items-center gap-3">
        <div className="bg-blue-400/20 p-2 rounded-lg"><Calculator size={16} className="text-blue-400" /></div>
        <div className="flex flex-col truncate flex-1">
          <span className="text-xs font-bold text-gray-200">{data.label || 'Calculate'}</span>
          <div className="text-[10px] text-blue-300 mt-1 font-mono bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">{data.expression || 'x + y'}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-400 border-2 border-gray-900" />
    </div>
  );
}
