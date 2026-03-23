import { NodeProps, Node } from '@xyflow/react';
import { LabelNodeData } from '../types';

export default function LabelNode({ data }: NodeProps<Node<LabelNodeData>>) {
  const sizes = {
    small: 'text-sm',
    medium: 'text-2xl',
    large: 'text-5xl font-black tracking-tight drop-shadow-md'
  };
  
  const selectedSize = sizes[data.size || 'medium'];

  return (
    <div className="pointer-events-auto group px-2 py-1 hover:bg-white/5 rounded cursor-grab">
      <div className={`font-bold text-gray-300/80 group-hover:text-white transition-colors ${selectedSize}`}>{data.text || 'Text Label'}</div>
    </div>
  );
}
