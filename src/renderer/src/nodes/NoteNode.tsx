import { NodeProps, Node } from '@xyflow/react';
import { NoteNodeData } from '../types';

export default function NoteNode({ data }: NodeProps<Node<NoteNodeData>>) {
  return (
    <div className="bg-yellow-200/90 backdrop-blur-sm border border-yellow-400 shadow-md min-w-[200px] min-h-[100px] text-gray-800 p-3 pointer-events-auto rounded shadow-[3px_3px_10px_rgba(0,0,0,0.1)] hover:shadow-[5px_5px_15px_rgba(0,0,0,0.15)] transition-shadow">
      <div className="text-[10px] font-bold text-yellow-700/50 uppercase tracking-widest mb-1">{data.label || 'Note'}</div>
      <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{data.content || 'Double click to edit note...'}</div>
    </div>
  );
}
