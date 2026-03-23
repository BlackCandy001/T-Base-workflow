import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { ExitNodeData } from '../types';
import { Octagon } from 'lucide-react';

export default function ExitNode({ data }: NodeProps<Node<ExitNodeData>>) {
  return (
    <div className="bg-gray-800 border-2 border-red-500/50 rounded-full shadow-lg min-w-[100px] text-gray-200 flex items-center justify-center gap-2 px-4 py-2 pointer-events-auto px-4 py-3">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-red-500 border-2 border-gray-900" />
      <Octagon size={16} className="text-red-500" fill="currentColor" />
      <span className="text-xs font-bold text-gray-200">{data.label || 'End / Exit'}</span>
    </div>
  );
}
