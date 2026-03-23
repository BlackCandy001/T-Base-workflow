import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { PermissionNodeData } from '../types';
import { ShieldCheck } from 'lucide-react';

export default function PermissionNode({ data }: NodeProps<Node<PermissionNodeData>>) {
  return (
    <div className="bg-gray-800 border-t-4 border-t-rose-500 rounded-xl shadow-[0_0_10px_rgba(244,63,94,0.1)] min-w-[180px] text-gray-200 pointer-events-auto">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-rose-500 border-2 border-gray-900" />
      
      <div className="p-3 flex items-center gap-3">
        <div className="bg-rose-500/20 p-2 rounded-lg"><ShieldCheck size={16} className="text-rose-400" /></div>
        <div className="flex flex-col truncate flex-1">
          <span className="text-xs font-bold text-gray-200">{data.label || 'Permission'}</span>
          <div className="text-[9px] text-rose-300 mt-1 uppercase font-bold bg-rose-950/50 px-1 py-0.5 rounded truncate">{(data.requiredRoles || ['Manager']).join(', ')}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-rose-500 border-2 border-gray-900" />
    </div>
  );
}
