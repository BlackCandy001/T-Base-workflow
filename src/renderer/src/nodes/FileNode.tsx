import { NodeProps, Node, Handle, Position } from '@xyflow/react';
import { FileNodeData } from '../types';
import { FileText } from 'lucide-react';

export default function FileNode({ data }: NodeProps<Node<FileNodeData>>) {
  return (
    <div className="bg-gray-800 border-t-4 border-t-teal-500 rounded-xl shadow-lg min-w-[180px] max-w-[220px] text-gray-200 pointer-events-auto">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-teal-500 border-2 border-gray-900" />
      
      <div className="p-3 flex items-center gap-3">
        <div className="bg-teal-500/20 p-2 rounded-lg"><FileText size={16} className="text-teal-400" /></div>
        <div className="flex flex-col truncate flex-1">
          <span className="text-xs font-bold text-gray-200">{data.label || 'File Operation'}</span>
          <div className="text-[10px] text-gray-400 mt-1 truncate border border-gray-700 bg-gray-900 px-1.5 py-0.5 rounded" title={data.filePath}>{data.filePath || '/data/file.txt'}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-teal-500 border-2 border-gray-900" />
    </div>
  );
}
