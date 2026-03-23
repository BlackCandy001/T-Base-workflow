import React, { useCallback, useRef, useState, useEffect } from 'react';
import { 
  ReactFlow, // ReactFlow is now a named import
  Controls, 
  Background, 
  Connection, 
  MiniMap,
  Panel,
  SelectionMode
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import { MousePointer2, Hand } from 'lucide-react';
import { AppNode } from '../types';

import MemberNode from '../nodes/MemberNode';
import TaskNode from '../nodes/TaskNode';
import ProjectNode from '../nodes/ProjectNode';
import DecisionNode from '../nodes/DecisionNode';
import GroupNode from '../nodes/GroupNode';
import TriggerNode from '../nodes/TriggerNode';
import TeamNode from '../nodes/TeamNode';
import ExitNode from '../nodes/ExitNode';
import LoopNode from '../nodes/LoopNode';
import DelayNode from '../nodes/DelayNode';
import ApiNode from '../nodes/ApiNode';
import DatabaseNode from '../nodes/DatabaseNode';
import FileNode from '../nodes/FileNode';
import NotificationNode from '../nodes/NotificationNode';
import AiNode from '../nodes/AiNode';
import ProgressNode from '../nodes/ProgressNode';
import CalculationNode from '../nodes/CalculationNode';
import NoteNode from '../nodes/NoteNode';
import LabelNode from '../nodes/LabelNode';
import PermissionNode from '../nodes/PermissionNode';
import ConfigNode from '../nodes/ConfigNode';
import NodeEditor from './NodeEditor';
import WorkflowTabs from './WorkflowTabs';
import { NODE_CONFIGS } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { useWorkflow } from '../contexts/WorkflowContext';

const nodeTypes = {
  member: MemberNode,
  task: TaskNode,
  project: ProjectNode,
  decision: DecisionNode,
  group: GroupNode,
  trigger: TriggerNode,
  team: TeamNode,
  exit: ExitNode,
  loop: LoopNode,
  delay: DelayNode,
  api: ApiNode,
  database: DatabaseNode,
  file: FileNode,
  notification: NotificationNode,
  ai: AiNode,
  progress: ProgressNode,
  calculation: CalculationNode,
  note: NoteNode,
  label: LabelNode,
  permission: PermissionNode,
  config: ConfigNode
};

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, onConnect, saveProject, loadProject 
  } = useWorkflow();
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const { theme, t } = usePreferences();

  const handleSave = async () => {
    await saveProject();
  };

  const handleLoad = async () => {
    await loadProject();
  };

  // onConnect is now provided by WorkflowContext
  
  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // Rule 1: Group nodes cannot participate in logic or edge connections
    if (sourceNode.type === 'group' || targetNode.type === 'group') return false;

    // Rule 2: Entry/Trigger have no incoming edges
    if (targetNode.type === 'trigger') return false;

    const config = NODE_CONFIGS[sourceNode.type as keyof typeof NODE_CONFIGS];
    if (config && config.connectableTo !== 'all') {
      if (!config.connectableTo[targetNode.type as keyof typeof config.connectableTo]) {
        return false;
      }
    }

    // Rule 3: Decision node enforces exactly 2 outputs
    if (sourceNode.type === 'decision') {
      const existingEdges = edges.filter(e => e.source === sourceNode.id);
      if (existingEdges.length >= 2) return false;
      if (existingEdges.some(e => e.sourceHandle === connection.sourceHandle)) return false;
    }

    return true;
  }, [nodes, edges]);

  const handleNodeUpdate = (id: string, data: any) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data };
        }
        return node;
      })
    );
  };

  // Bottleneck Detection: Highlight nodes with many incoming edges
  useEffect(() => {
    setNodes((nds) => {
      const threshold = 3; // Define what counts as a bottleneck
      const incomingCounts: Record<string, number> = {};

      edges.forEach((edge) => {
        incomingCounts[edge.target] = (incomingCounts[edge.target] || 0) + 1;
      });

      return nds.map((node) => {
        const isBottleneck = (incomingCounts[node.id] || 0) >= threshold;
        if (node.data.isBottleneck !== isBottleneck) {
          return {
            ...node,
            data: { ...node.data, isBottleneck }
          };
        }
        return node;
      });
    });
  }, [edges, setNodes]);

  const handleCloseEditor = () => {
    setNodes((nds) => nds.map(n => ({ ...n, selected: false })));
  };

  const selectedNodes = nodes.filter(n => n.selected);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : undefined;

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let newNodeData: any = { label: `${type} node`, createdAt: Date.now() };

      switch(type) {
        case 'member': newNodeData = { ...newNodeData, name: 'New Member', role: 'Developer', status: 'Idle' }; break;
        case 'task': newNodeData = { ...newNodeData, title: 'New Task', description: '', progress: 0 }; break;
        case 'project': newNodeData = { ...newNodeData, name: 'New Project' }; break;
        case 'decision': newNodeData = { ...newNodeData, label: 'Condition?' }; break;
        case 'trigger': newNodeData = { ...newNodeData, type: 'manual' }; break;
        case 'group': newNodeData = { ...newNodeData, width: 400, height: 300 }; break;
        case 'team': newNodeData = { ...newNodeData, teamName: 'New Team' }; break;
        case 'exit': newNodeData = { ...newNodeData }; break;
        case 'loop': newNodeData = { ...newNodeData, maxIterations: 10 }; break;
        case 'delay': newNodeData = { ...newNodeData, duration: 5, unit: 'minutes' }; break;
        case 'api': newNodeData = { ...newNodeData, method: 'GET', url: 'https://api.example.com' }; break;
        case 'database': newNodeData = { ...newNodeData, query: 'SELECT * FROM users', action: 'READ' }; break;
        case 'file': newNodeData = { ...newNodeData, filePath: '/tmp/output.txt', action: 'WRITE' }; break;
        case 'notification': newNodeData = { ...newNodeData, channel: 'email', message: 'Hello!' }; break;
        case 'ai': newNodeData = { ...newNodeData, prompt: 'Summarize...', model: 'gpt-4' }; break;
        case 'progress': newNodeData = { ...newNodeData, measurementStyle: 'percentage' }; break;
        case 'calculation': newNodeData = { ...newNodeData, expression: 'a + b' }; break;
        case 'note': newNodeData = { ...newNodeData, content: 'Write something...' }; break;
        case 'label': newNodeData = { ...newNodeData, text: 'Custom Label', size: 'medium' }; break;
        case 'permission': newNodeData = { ...newNodeData, requiredRoles: ['Manager'] }; break;
        case 'config': newNodeData = { ...newNodeData, key: 'API_KEY', value: 'secret' }; break;
      }

      const newNode: AppNode = {
        id: nanoid(),
        type,
        position,
        data: newNodeData,
        // For resizable nodes like group, set initial dimensions
        ...(type === 'group' ? { width: 400, height: 300 } : {})
      } as AppNode;

      // Support drop onto group
      const targetGroup = nodes.find(n => n.type === 'group' &&
        position.x >= n.position.x && position.x <= n.position.x + (n.width || n.data.width as number || 400) &&
        position.y >= n.position.y && position.y <= n.position.y + (n.height || n.data.height as number || 300)
      );

      if (targetGroup) {
        newNode.parentId = targetGroup.id;
        newNode.extent = 'parent';
        // Adjust position relative to group
        newNode.position = {
          x: position.x - targetGroup.position.x,
          y: position.y - targetGroup.position.y,
        };
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, nodes]
  );

  return (
    <div className="flex-1 h-full relative flex flex-col min-h-0 min-w-0" ref={reactFlowWrapper}>
      <WorkflowTabs />
      <div className="flex-1 relative overflow-hidden flex min-h-0 min-w-0">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes as any}
        colorMode={theme}
        panOnDrag={!isSelectMode}
        selectionOnDrag={isSelectMode}
        selectionMode={SelectionMode.Partial}
        panOnScroll={true}
        fitView
        className="bg-gray-50 dark:bg-gray-950 transition-colors"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background color={theme === 'dark' ? '#1f2937' : '#e5e7eb'} gap={16} size={2} />
        <Controls className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 fill-gray-500 dark:fill-gray-300 shadow-xl rounded-lg overflow-hidden transition-colors" />
        <MiniMap 
          nodeStrokeColor={(n) => {
            if (n.type === 'member') return '#3b82f6';
            if (n.type === 'task') return '#10b981';
            if (n.type === 'project') return '#a855f7';
            return '#eee';
          }}
          nodeColor={theme === 'dark' ? '#1f2937' : '#f3f4f6'}
          maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)'}
          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl transition-colors"
        />
        
        {/* Toolbar tools */}
        <Panel position="top-left" className="flex gap-2">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-xl flex gap-1 shadow-lg transition-colors">
            <button
              onClick={() => setIsSelectMode(false)}
              className={`p-2 rounded-lg transition-colors ${!isSelectMode ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Pan Tool (Hand)"
            >
              <Hand size={18} />
            </button>
            <button
              onClick={() => setIsSelectMode(true)}
              className={`p-2 rounded-lg transition-colors ${isSelectMode ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Select Tool (Pointer)"
            >
              <MousePointer2 size={18} />
            </button>
          </div>
        </Panel>

        <Panel position="top-right" className="flex gap-3">
          <button 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-blue-900/20 transition-colors"
          >
            {t('save_project')}
          </button>
          <button 
            onClick={handleLoad} 
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-purple-900/20 transition-colors"
          >
            {t('load_project')}
          </button>
        </Panel>
        </ReactFlow>
      </div>
      
      {selectedNode && (
        <NodeEditor 
          node={selectedNode as AppNode} 
          onUpdate={handleNodeUpdate} 
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
