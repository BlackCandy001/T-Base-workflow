import { Node, Edge } from '@xyflow/react';

// 6. Node Metadata Standardization
export type BaseNodeData = {
  label: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
} & Record<string, unknown>;

export type Role = 'Developer' | 'Designer' | 'Manager';
export type Status = 'Idle' | 'Working' | 'Offline';

// Organization & Core
export type MemberNodeData = BaseNodeData & { name: string; role: Role; status: Status; };
export type TaskNodeData = BaseNodeData & { title: string; progress: number; deadline?: string; };
export type ProjectNodeData = BaseNodeData & { name: string; };
export type GroupNodeData = BaseNodeData & { width?: number; height?: number; };
export type TeamNodeData = BaseNodeData & { teamName: string; }; // New

// Flow Control
export type TriggerNodeData = BaseNodeData & { type: 'manual' | 'schedule' | 'webhook'; };
export type DecisionNodeData = BaseNodeData;
export type LoopNodeData = BaseNodeData & { maxIterations: number; breakCondition?: string; };
export type DelayNodeData = BaseNodeData & { duration: number; unit: 'seconds' | 'minutes' | 'hours' | 'days'; }; // New
export type ExitNodeData = BaseNodeData; // New

// System & Integration
export type ApiNodeData = BaseNodeData & { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; url: string; }; // New
export type DatabaseNodeData = BaseNodeData & { query: string; action: 'read' | 'write'; }; // New
export type FileNodeData = BaseNodeData & { filePath: string; action: 'read' | 'write' | 'delete'; }; // New
export type NotificationNodeData = BaseNodeData & { channel: 'email' | 'slack' | 'in-app'; message: string; }; // New
export type AiNodeData = BaseNodeData & { prompt: string; model: 'gpt-4' | 'gemini' | 'claude'; }; // New

// Analytics & Metrics
export type ProgressNodeData = BaseNodeData & { measurementStyle: 'percentage' | 'fraction'; }; // New
export type CalculationNodeData = BaseNodeData & { expression: string; }; // New

// Documentation & Meta
export type NoteNodeData = BaseNodeData & { content: string; }; // New
export type LabelNodeData = BaseNodeData & { text: string; size: 'small' | 'medium' | 'large'; }; // New
export type PermissionNodeData = BaseNodeData & { requiredRoles: Role[]; }; // New
export type ConfigNodeData = BaseNodeData & { key: string; value: string; isSecure: boolean; }; // New

export type AppNode = 
  | Node<MemberNodeData, 'member'>
  | Node<TaskNodeData, 'task'>
  | Node<ProjectNodeData, 'project'>
  | Node<GroupNodeData, 'group'>
  | Node<TeamNodeData, 'team'>
  | Node<TriggerNodeData, 'trigger'>
  | Node<DecisionNodeData, 'decision'>
  | Node<LoopNodeData, 'loop'>
  | Node<DelayNodeData, 'delay'>
  | Node<ExitNodeData, 'exit'>
  | Node<ApiNodeData, 'api'>
  | Node<DatabaseNodeData, 'database'>
  | Node<FileNodeData, 'file'>
  | Node<NotificationNodeData, 'notification'>
  | Node<AiNodeData, 'ai'>
  | Node<ProgressNodeData, 'progress'>
  | Node<CalculationNodeData, 'calculation'>
  | Node<NoteNodeData, 'note'>
  | Node<LabelNodeData, 'label'>
  | Node<PermissionNodeData, 'permission'>
  | Node<ConfigNodeData, 'config'>;

export type AppEdge = Edge;

export interface Workflow {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
}

export type NodeTypeMap = AppNode['type'];

// 7. Node Capability Definition
export type NodeConfig = {
  inputs: number;
  outputs: number;
  connectableTo: Partial<Record<AppNode['type'], boolean>> | 'all';
};

export const NODE_CONFIGS: Record<AppNode['type'], NodeConfig> = {
  // Organization
  member: { inputs: 0, outputs: 1, connectableTo: { task: true, team: true } },
  task: { inputs: Infinity, outputs: Infinity, connectableTo: 'all' },
  project: { inputs: 0, outputs: Infinity, connectableTo: { task: true, group: true } },
  group: { inputs: 0, outputs: 0, connectableTo: {} },
  team: { inputs: Infinity, outputs: Infinity, connectableTo: { task: true, project: true } },
  
  // Flow Control
  trigger: { inputs: 0, outputs: Infinity, connectableTo: 'all' },
  decision: { inputs: 1, outputs: 2, connectableTo: 'all' },
  loop: { inputs: 1, outputs: 2, connectableTo: 'all' },
  delay: { inputs: 1, outputs: 1, connectableTo: 'all' },
  exit: { inputs: Infinity, outputs: 0, connectableTo: {} }, // Terminal node
  
  // Integration
  api: { inputs: 1, outputs: 1, connectableTo: 'all' },
  database: { inputs: 1, outputs: 1, connectableTo: 'all' },
  file: { inputs: 1, outputs: 1, connectableTo: 'all' },
  notification: { inputs: Infinity, outputs: 1, connectableTo: 'all' },
  ai: { inputs: 1, outputs: 1, connectableTo: 'all' },
  
  // Analytics
  progress: { inputs: Infinity, outputs: 1, connectableTo: 'all' },
  calculation: { inputs: Infinity, outputs: 1, connectableTo: 'all' },
  
  // Meta
  note: { inputs: 0, outputs: 0, connectableTo: {} }, // Just like group, visual only
  label: { inputs: 0, outputs: 0, connectableTo: {} },
  permission: { inputs: 1, outputs: 1, connectableTo: 'all' },
  config: { inputs: 0, outputs: 1, connectableTo: 'all' } // Injects config
};
