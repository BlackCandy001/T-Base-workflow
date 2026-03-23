import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { CheckSquare, Clock } from 'lucide-react';
import { TaskNodeData } from '../types';
import clsx from 'clsx';

export default function TaskNode({ data }: NodeProps<Node<TaskNodeData>>) {
  return (
    <div className={`bg-gray-800 border-2 rounded-xl shadow-lg min-w-[240px] text-gray-200 group hover:border-emerald-500/50 transition-colors ${data.isBottleneck ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-gray-700'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-400 border-2 border-gray-800" />
      <div className="p-3 border-b border-gray-700 bg-emerald-900/10 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckSquare size={16} />
          <div className="font-semibold text-sm">{data.title}</div>
        </div>
      </div>
      <div className="p-4 text-xs flex flex-col gap-3">
        {data.description && <p className="text-gray-400">{data.description}</p>}
        {(!data.description) && <p className="text-gray-500 italic">No description</p>}
        
        {data.deadline && (
          <div className="flex items-center gap-2 text-gray-300 bg-gray-700/50 p-2 rounded-lg">
            <Clock size={14} className="text-amber-400" />
            <span>{data.deadline}</span>
          </div>
        )}

        <div>
          <div className="flex justify-between mb-1 text-gray-400">
            <span>Progress</span>
            <span>{data.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className={clsx("h-1.5 rounded-full", data.progress === 100 ? "bg-emerald-500" : "bg-blue-500")} 
              style={{ width: `${data.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-400 border-2 border-gray-800" />
    </div>
  );
}
