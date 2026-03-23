import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { TeamNodeData } from '../types';
import { Users } from 'lucide-react';

export default function TeamNode({ data }: NodeProps<Node<TeamNodeData>>) {
  return (
    <div className="bg-gray-800 border border-indigo-500/50 rounded-xl shadow-lg min-w-[200px] text-gray-200 p-3 pointer-events-auto group hover:border-indigo-500 transition-colors">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500 border-2 border-gray-900" />
      <div className="flex items-center gap-3">
        <div className="bg-indigo-500/20 p-2 rounded-lg group-hover:bg-indigo-500/30 transition-colors"><Users size={16} className="text-indigo-400" /></div>
        <div>
          <div className="text-xs font-bold text-gray-200">{data.label || 'Team'}</div>
          <div className="text-[10px] text-indigo-400 mt-0.5 font-medium">{data.teamName || 'Unassigned'}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500 border-2 border-gray-900" />
    </div>
  );
}
