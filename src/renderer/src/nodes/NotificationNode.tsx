import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { NotificationNodeData } from '../types';
import { Bell } from 'lucide-react';

export default function NotificationNode({ data }: NodeProps<Node<NotificationNodeData>>) {
  return (
    <div className="bg-gray-800 border-t-4 border-t-yellow-400 rounded-xl shadow-lg min-w-[180px] text-gray-200 pointer-events-auto">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-400 border-2 border-gray-900" />
      
      <div className="p-3 flex items-center gap-3">
        <div className="bg-yellow-400/20 p-2 rounded-lg"><Bell size={16} className="text-yellow-400" /></div>
        <div className="flex flex-col truncate flex-1">
          <span className="text-xs font-bold text-gray-200">{data.label || 'Notify'}</span>
          <div className="text-[10px] text-gray-400 mt-0.5 capitalize font-medium">{data.channel || 'Email'}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-yellow-400 border-2 border-gray-900" />
    </div>
  );
}
