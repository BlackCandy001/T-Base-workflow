import { NodeProps, Node, NodeResizer } from '@xyflow/react';
import { GroupNodeData } from '../types';

export default function GroupNode({ data, width, height, selected }: NodeProps<Node<GroupNodeData>>) {
  return (
    <div 
      className="h-full w-full border-2 border-dashed border-gray-600 dark:border-gray-500 bg-gray-600/5 dark:bg-gray-400/5 rounded-xl transition-colors"
    >
      <NodeResizer 
        minWidth={100} 
        minHeight={100} 
        isVisible={selected} 
        lineClassName="border-blue-500" 
        handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded-full"
      />
      <div className="absolute -top-[1.4rem] left-4 px-3 py-1 bg-gray-800 dark:bg-gray-700 text-gray-300 text-xs font-mono font-bold rounded-t-lg border border-gray-600 dark:border-gray-500 border-b-0 tracking-wide select-none">
        {data.label || 'Group'}
      </div>
      {/* Visual container. Dragging is handled by React Flow at the node level. */}
    </div>
  );
}
