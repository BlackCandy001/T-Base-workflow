import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Folder } from 'lucide-react';
import { ProjectNodeData } from '../types';

export default function ProjectNode({ data }: NodeProps<Node<ProjectNodeData>>) {
  return (
    <div className={`bg-gray-800/80 backdrop-blur-md border-2 rounded-xl shadow-lg min-w-[280px] min-h-[200px] text-gray-200 p-1 group hover:border-purple-500/80 transition-colors pointer-events-auto ${data.isBottleneck ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-dashed border-purple-500/40'}`}>
      <div className="bg-purple-900/30 rounded-lg p-3 flex items-center justify-center gap-2 mb-2 pointer-events-none">
        <Folder size={18} className="text-purple-400" />
        <span className="font-semibold text-sm text-purple-200 tracking-wide uppercase">{data.name}</span>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-400 border-2 border-gray-800" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-400 border-2 border-gray-800" />
    </div>
  );
}
