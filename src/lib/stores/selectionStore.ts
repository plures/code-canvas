import { writable, derived } from 'svelte/store';
import type { CanvasNode, CanvasEdge } from '../types/canvas.js';

export interface SelectionState {
  nodes: Set<string>;
  edges: Set<string>;
  selectionBox: {
    active: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
}

export interface SelectedElement {
  type: 'node' | 'edge';
  id: string;
  element: CanvasNode | CanvasEdge;
}

// Selection store
function createSelectionStore() {
  const { subscribe, set, update } = writable<SelectionState>({
    nodes: new Set(),
    edges: new Set(),
    selectionBox: {
      active: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0
    }
  });

  return {
    subscribe,
    
    // Node selection
    selectNode: (nodeId: string, multiSelect = false) => {
      update(state => {
        if (!multiSelect) {
          state.nodes.clear();
          state.edges.clear();
        }
        state.nodes.add(nodeId);
        return state;
      });
    },

    deselectNode: (nodeId: string) => {
      update(state => {
        state.nodes.delete(nodeId);
        return state;
      });
    },

    toggleNode: (nodeId: string, multiSelect = false) => {
      update(state => {
        if (state.nodes.has(nodeId)) {
          state.nodes.delete(nodeId);
        } else {
          if (!multiSelect) {
            state.nodes.clear();
            state.edges.clear();
          }
          state.nodes.add(nodeId);
        }
        return state;
      });
    },

    // Edge selection  
    selectEdge: (edgeId: string, multiSelect = false) => {
      update(state => {
        if (!multiSelect) {
          state.nodes.clear();
          state.edges.clear();
        }
        state.edges.add(edgeId);
        return state;
      });
    },

    deselectEdge: (edgeId: string) => {
      update(state => {
        state.edges.delete(edgeId);
        return state;
      });
    },

    toggleEdge: (edgeId: string, multiSelect = false) => {
      update(state => {
        if (state.edges.has(edgeId)) {
          state.edges.delete(edgeId);
        } else {
          if (!multiSelect) {
            state.nodes.clear();
            state.edges.clear();
          }
          state.edges.add(edgeId);
        }
        return state;
      });
    },

    // Multi-selection
    selectMultiple: (nodeIds: string[], edgeIds: string[]) => {
      update(state => {
        state.nodes.clear();
        state.edges.clear();
        nodeIds.forEach(id => state.nodes.add(id));
        edgeIds.forEach(id => state.edges.add(id));
        return state;
      });
    },

    // Selection box
    startSelectionBox: (x: number, y: number) => {
      update(state => {
        state.selectionBox = {
          active: true,
          startX: x,
          startY: y,
          endX: x,
          endY: y
        };
        return state;
      });
    },

    updateSelectionBox: (x: number, y: number) => {
      update(state => {
        if (state.selectionBox.active) {
          state.selectionBox.endX = x;
          state.selectionBox.endY = y;
        }
        return state;
      });
    },

    finishSelectionBox: (nodes: CanvasNode[], edges: CanvasEdge[], multiSelect = false) => {
      update(state => {
        if (state.selectionBox.active) {
          const box = state.selectionBox;
          const minX = Math.min(box.startX, box.endX);
          const maxX = Math.max(box.startX, box.endX);
          const minY = Math.min(box.startY, box.endY);
          const maxY = Math.max(box.startY, box.endY);

          if (!multiSelect) {
            state.nodes.clear();
            state.edges.clear();
          }

          // Select nodes within box
          nodes.forEach(node => {
            if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
              state.nodes.add(node.id);
            }
          });

          // Select edges whose midpoint is within box
          edges.forEach(edge => {
            const sourceId = edge.from || edge.fromNode;
            const targetId = edge.to || edge.toNode;
            const sourceNode = nodes.find(n => n.id === sourceId);
            const targetNode = nodes.find(n => n.id === targetId);
            if (sourceNode && targetNode && edge.id) {
              const midX = (sourceNode.x + targetNode.x) / 2;
              const midY = (sourceNode.y + targetNode.y) / 2;
              if (midX >= minX && midX <= maxX && midY >= minY && midY <= maxY) {
                state.edges.add(edge.id);
              }
            }
          });

          state.selectionBox.active = false;
        }
        return state;
      });
    },

    cancelSelectionBox: () => {
      update(state => {
        state.selectionBox.active = false;
        return state;
      });
    },

    // Clear all selections
    clearSelection: () => {
      update(state => {
        state.nodes.clear();
        state.edges.clear();
        state.selectionBox.active = false;
        return state;
      });
    },

    // Select all
    selectAll: (nodes: CanvasNode[], edges: CanvasEdge[]) => {
      update(state => {
        state.nodes.clear();
        state.edges.clear();
        nodes.forEach(node => state.nodes.add(node.id));
        edges.forEach(edge => edge.id && state.edges.add(edge.id));
        return state;
      });
    }
  };
}

export const selectionStore = createSelectionStore();

// Derived stores for convenience
export const selectedNodes = derived(selectionStore, $selection => Array.from($selection.nodes));
export const selectedEdges = derived(selectionStore, $selection => Array.from($selection.edges));
export const hasSelection = derived(selectionStore, $selection => 
  $selection.nodes.size > 0 || $selection.edges.size > 0
);
export const selectionCount = derived(selectionStore, $selection => 
  $selection.nodes.size + $selection.edges.size
);

// Helper functions
export function isNodeSelected(nodeId: string, selection: SelectionState): boolean {
  return selection.nodes.has(nodeId);
}

export function isEdgeSelected(edgeId: string, selection: SelectionState): boolean {
  return selection.edges.has(edgeId);
}

export function getSelectionBounds(nodes: CanvasNode[], edges: CanvasEdge[], selection: SelectionState): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  const selectedNodes = nodes.filter(n => selection.nodes.has(n.id));
  
  if (selectedNodes.length === 0) return null;
  
  let minX = selectedNodes[0].x;
  let maxX = selectedNodes[0].x;
  let minY = selectedNodes[0].y;
  let maxY = selectedNodes[0].y;
  
  selectedNodes.forEach(node => {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
  });
  
  return { minX, minY, maxX, maxY };
}