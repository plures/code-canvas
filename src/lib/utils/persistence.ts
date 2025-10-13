// Local storage utilities for canvas persistence
import type { CanvasNode, CanvasEdge } from '../types/canvas.js';

const STORAGE_KEY = 'fsm-canvas-data';
const PROJECT_LIST_KEY = 'fsm-canvas-projects';

export interface SavedCanvas {
  id: string;
  name: string;
  timestamp: number;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface ProjectMetadata {
  id: string;
  name: string;
  timestamp: number;
  nodeCount: number;
  edgeCount: number;
}

/**
 * Save current canvas to localStorage
 */
export function saveCanvas(
  nodes: CanvasNode[], 
  edges: CanvasEdge[], 
  name: string = 'Untitled Canvas'
): string {
  const canvasId = `canvas-${Date.now()}`;
  const canvasData: SavedCanvas = {
    id: canvasId,
    name,
    timestamp: Date.now(),
    nodes: structuredClone(nodes),
    edges: structuredClone(edges)
  };

  // Save the canvas
  localStorage.setItem(`${STORAGE_KEY}-${canvasId}`, JSON.stringify(canvasData));

  // Update project list
  const projectList = getProjectList();
  const projectMetadata: ProjectMetadata = {
    id: canvasId,
    name,
    timestamp: canvasData.timestamp,
    nodeCount: nodes.length,
    edgeCount: edges.length
  };
  
  projectList.push(projectMetadata);
  localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(projectList));

  return canvasId;
}

/**
 * Load canvas from localStorage
 */
export function loadCanvas(canvasId: string): SavedCanvas | null {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY}-${canvasId}`);
    if (!data) return null;
    return JSON.parse(data) as SavedCanvas;
  } catch (error) {
    console.error('Error loading canvas:', error);
    return null;
  }
}

/**
 * Get list of all saved projects
 */
export function getProjectList(): ProjectMetadata[] {
  try {
    const data = localStorage.getItem(PROJECT_LIST_KEY);
    if (!data) return [];
    return JSON.parse(data) as ProjectMetadata[];
  } catch (error) {
    console.error('Error loading project list:', error);
    return [];
  }
}

/**
 * Delete a saved canvas
 */
export function deleteCanvas(canvasId: string): boolean {
  try {
    localStorage.removeItem(`${STORAGE_KEY}-${canvasId}`);
    
    // Update project list
    const projectList = getProjectList();
    const filteredList = projectList.filter(p => p.id !== canvasId);
    localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(filteredList));
    
    return true;
  } catch (error) {
    console.error('Error deleting canvas:', error);
    return false;
  }
}

/**
 * Auto-save current canvas state
 */
export function autoSave(nodes: CanvasNode[], edges: CanvasEdge[]): void {
  const autoSaveData = {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
    timestamp: Date.now()
  };
  
  localStorage.setItem(`${STORAGE_KEY}-autosave`, JSON.stringify(autoSaveData));
}

/**
 * Load auto-saved canvas state
 */
export function loadAutoSave(): { nodes: CanvasNode[]; edges: CanvasEdge[] } | null {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY}-autosave`);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return {
      nodes: parsed.nodes || [],
      edges: parsed.edges || []
    };
  } catch (error) {
    console.error('Error loading auto-save:', error);
    return null;
  }
}

/**
 * Export canvas as JSON
 */
export function exportCanvas(nodes: CanvasNode[], edges: CanvasEdge[], name: string): string {
  const exportData = {
    name,
    version: '1.0',
    timestamp: Date.now(),
    nodes,
    edges
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import canvas from JSON string
 */
export function importCanvas(jsonString: string): { nodes: CanvasNode[]; edges: CanvasEdge[]; name: string } | null {
  try {
    const data = JSON.parse(jsonString);
    
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
      name: data.name || 'Imported Canvas'
    };
  } catch (error) {
    console.error('Error importing canvas:', error);
    return null;
  }
}