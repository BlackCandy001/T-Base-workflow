import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState, Connection, Edge, addEdge } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { Workflow } from '../types';

interface WorkflowContextType {
  workflows: Workflow[];
  activeId: string;
  nodes: any[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
  setNodes: any;
  setEdges: any;
  onConnect: (params: Connection | Edge) => void;
  createWorkflow: (name?: string) => void;
  deleteWorkflow: (id: string) => void;
  switchWorkflow: (id: string) => void;
  renameWorkflow: (id: string, name: string) => void;
  saveProject: () => Promise<void>;
  loadProject: () => Promise<void>;
  saveProjectSilent: () => Promise<void>;
  loadProjectSilent: () => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export const WorkflowProvider = ({ children }: { children: React.ReactNode }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id: 'initial', name: 'Workflow 1', nodes: [], edges: [] }
  ]);
  const [activeId, setActiveId] = useState<string>('initial');

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [_lastSaved, setLastSaved] = useState<number>(Date.now());

  // Function to sync current workspace back to the workflows list
  const syncCurrentToCollection = useCallback(() => {
    setWorkflows(prev => prev.map(w => 
      w.id === activeId ? { ...w, nodes, edges } : w
    ));
  }, [activeId, nodes, edges]);

  const switchWorkflow = useCallback((id: string) => {
    // 1. Save current state
    syncCurrentToCollection();
    
    // 2. Load new state
    const target = workflows.find(w => w.id === id);
    if (target) {
      setActiveId(id);
      setNodes(target.nodes);
      setEdges(target.edges);
    }
  }, [syncCurrentToCollection, workflows, setNodes, setEdges]);

  const createWorkflow = useCallback((name?: string) => {
    const newId = nanoid();
    const newWorkflow: Workflow = {
      id: newId,
      name: name || `Workflow ${workflows.length + 1}`,
      nodes: [],
      edges: []
    };
    
    setWorkflows(prev => [...prev, newWorkflow]);
    // Auto switch to new
    setActiveId(newId);
    setNodes([]);
    setEdges([]);
  }, [workflows.length, setNodes, setEdges]);

  const deleteWorkflow = useCallback((id: string) => {
    if (workflows.length <= 1) return; // Keep at least one
    
    setWorkflows(prev => prev.filter(w => w.id !== id));
    if (activeId === id) {
      const remaining = workflows.filter(w => w.id !== id);
      const next = remaining[0];
      setActiveId(next.id);
      setNodes(next.nodes);
      setEdges(next.edges);
    }
  }, [workflows, activeId, setNodes, setEdges]);

  const renameWorkflow = useCallback((id: string, name: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, name } : w));
  }, []);

  const saveProject = useCallback(async () => {
    if (window.api?.saveProject) {
      // Sync current before saving
      const currentWorkflows = workflows.map(w => 
        w.id === activeId ? { ...w, nodes, edges } : w
      );
      await window.api.saveProject({ workflows: currentWorkflows, activeId });
      setLastSaved(Date.now());
    }
  }, [nodes, edges, workflows, activeId]);

  const loadProject = useCallback(async () => {
    if (window.api?.loadProject) {
      const data = await window.api.loadProject();
      if (data && data.workflows) {
        setWorkflows(data.workflows);
        const active = data.workflows.find(w => w.id === (data.activeId || data.workflows[0].id));
        if (active) {
          setActiveId(active.id);
          setNodes(active.nodes);
          setEdges(active.edges);
        }
      }
    }
  }, [setNodes, setEdges]);

  const saveProjectSilent = useCallback(async () => {
    // @ts-ignore
    if (window.api?.saveProjectSilent) {
      const currentWorkflows = workflows.map(w => 
        w.id === activeId ? { ...w, nodes, edges } : w
      );
      // @ts-ignore
      await window.api.saveProjectSilent({ workflows: currentWorkflows, activeId });
      setLastSaved(Date.now());
    }
  }, [nodes, edges, workflows, activeId]);

  const loadProjectSilent = useCallback(async () => {
    // @ts-ignore
    if (window.api?.loadProjectSilent) {
      // @ts-ignore
      const data = await window.api.loadProjectSilent();
      if (data && data.workflows) {
        setWorkflows(data.workflows);
        const active = data.workflows.find((w: any) => w.id === (data.activeId || data.workflows[0].id));
        if (active) {
          setActiveId(active.id);
          setNodes(active.nodes);
          setEdges(active.edges);
        }
      }
    }
  }, [setNodes, setEdges]);

  const onConnect = useCallback((params: Connection | Edge) => {
    let newEdge = { ...params } as any;
    const sourceNode = nodes.find(n => n.id === params.source);
    
    if (sourceNode?.type === 'decision') {
      const isTrue = params.sourceHandle === 'true';
      newEdge.data = { condition: isTrue ? 'true' : 'false' };
      newEdge.animated = true;
      newEdge.style = { stroke: isTrue ? '#10b981' : '#ef4444', strokeWidth: 2 };
    }
    
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges, nodes]);

  // Auto-save logic (every 30 seconds if changed) - SILENT
  useEffect(() => {
    const timer = setInterval(() => {
      saveProjectSilent();
    }, 30000); 

    return () => clearInterval(timer);
  }, [saveProjectSilent]);

  // Ctrl+S listener - MANUAL (shows dialog)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject]);

  // Initial load - SILENT
  useEffect(() => {
    loadProjectSilent();
  }, []);

  return (
    <WorkflowContext.Provider value={{ 
      workflows, activeId, nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, onConnect, 
      createWorkflow, deleteWorkflow, switchWorkflow, renameWorkflow,
      saveProject, loadProject, saveProjectSilent, loadProjectSilent 
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider');
  return context;
};
