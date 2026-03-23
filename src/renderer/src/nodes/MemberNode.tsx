import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { User } from 'lucide-react';
import { MemberNodeData } from '../types';

export default function MemberNode({ data }: NodeProps<Node<MemberNodeData>>) {
  return (
    <div className={`bg-gray-800 border-2 rounded-xl shadow-lg min-w-[200px] text-gray-200 group hover:border-blue-500/50 transition-colors ${data.isBottleneck ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-gray-700'}`}>
      <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <User size={16} />
        </div>
        <div className="font-semibold text-sm">{data.name}</div>
      </div>
      <div className="p-4 text-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Role:</span>
          <span className="font-medium text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md">{data.role}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Status:</span>
          <span className="font-medium flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${data.status === 'Working' ? 'bg-emerald-500' : data.status === 'Idle' ? 'bg-amber-500' : 'bg-gray-500'}`}></span>
            {data.status}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-400 border-2 border-gray-800" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-400 border-2 border-gray-800" />
    </div>
  );
}
