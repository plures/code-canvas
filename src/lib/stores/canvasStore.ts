import { writable, derived } from 'svelte/store';
import type { CanvasState, CanvasNode, CanvasEdge } from '../types/canvas.js';
import { autoSave, loadAutoSave } from '../utils/persistence.js';

// Initial canvas state
const initialState: CanvasState = {
  nodes: [],
  edges: [],
  selectedNode: undefined,
  selectedEdge: undefined,
  mode: 'canvas',
  zoom: 1,
  pan: { x: 0, y: 0 }
};

// Create the main canvas store
function createCanvasStore() {
  const { subscribe, set, update } = writable<CanvasState>(initialState);

  // Auto-save with debouncing
  let saveTimeout: number | null = null;
  const triggerAutoSave = (state: CanvasState) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      autoSave(state.nodes, state.edges);
    }, 2000) as unknown as number;
  };

  return {
    subscribe,
    set,
    update,

    // Node operations
    addNode: (node: CanvasNode) => update(state => {
      const newState = {
        ...state,
        nodes: [...state.nodes, node]
      };
      triggerAutoSave(newState);
      return newState;
    }),

    removeNode: (nodeId: string) => update(state => {
      const newState = {
        ...state,
        nodes: state.nodes.filter(n => n.id !== nodeId),
        edges: state.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
        selectedNode: state.selectedNode?.id === nodeId ? undefined : state.selectedNode
      };
      triggerAutoSave(newState);
      return newState;
    }),

    updateNode: (nodeId: string, changes: Partial<CanvasNode>) => update(state => {
      const newState = {
        ...state,
        nodes: state.nodes.map(node => 
          node.id === nodeId ? { ...node, ...changes } : node
        )
      };
      triggerAutoSave(newState);
      return newState;
    }),

    selectNode: (node: CanvasNode) => update(state => ({
      ...state,
      selectedNode: node,
      selectedEdge: undefined
    })),

    // Edge operations
    addEdge: (edge: CanvasEdge) => update(state => {
      const newState = {
        ...state,
        edges: [...state.edges, { ...edge, id: edge.id || `${edge.from}-${edge.to}` }]
      };
      triggerAutoSave(newState);
      return newState;
    }),

    removeEdge: (edgeId: string) => update(state => {
      const newState = {
        ...state,
        edges: state.edges.filter(e => e.id !== edgeId),
        selectedEdge: state.selectedEdge?.id === edgeId ? undefined : state.selectedEdge
      };
      triggerAutoSave(newState);
      return newState;
    }),

    selectEdge: (edge: CanvasEdge) => update(state => ({
      ...state,
      selectedEdge: edge,
      selectedNode: undefined
    })),

    // Canvas operations
    setMode: (mode: 'canvas' | 'fsm') => update(state => ({
      ...state,
      mode
    })),

    setZoom: (zoom: number) => update(state => ({
      ...state,
      zoom: Math.max(0.1, Math.min(5, zoom))
    })),

    setPan: (pan: { x: number; y: number }) => update(state => ({
      ...state,
      pan
    })),

    clearSelection: () => update(state => ({
      ...state,
      selectedNode: undefined,
      selectedEdge: undefined
    })),

    loadCanvas: (canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => update(state => ({
      ...state,
      nodes: canvas.nodes,
      edges: canvas.edges,
      selectedNode: undefined,
      selectedEdge: undefined
    })),

    loadAutoSavedCanvas: () => {
      const autoSavedData = loadAutoSave();
      if (autoSavedData) {
        update(state => ({
          ...state,
          nodes: autoSavedData.nodes,
          edges: autoSavedData.edges,
          selectedNode: undefined,
          selectedEdge: undefined
        }));
        return true;
      }
      return false;
    },

    reset: () => set(initialState)
  };
}

export const canvasStore = createCanvasStore();

// Derived stores for specific data
export const selectedNode = derived(canvasStore, $canvas => $canvas.selectedNode);
export const selectedEdge = derived(canvasStore, $canvas => $canvas.selectedEdge);
export const canvasMode = derived(canvasStore, $canvas => $canvas.mode);
export const canvasZoom = derived(canvasStore, $canvas => $canvas.zoom);
export const canvasPan = derived(canvasStore, $canvas => $canvas.pan);