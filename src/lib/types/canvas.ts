// Canvas types for the FSM editor

export interface CanvasNode {
  id: string;
  type: "box" | "fsm" | "control" | "doc" | "database" | "text" | "file" | "link" | "group";
  label?: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  file?: string;
  url?: string;
  ref?: string;
  props?: Record<string, unknown>;
}

export interface CanvasEdge {
  id?: string;
  from?: string;
  to?: string;
  fromNode?: string;
  toNode?: string;
  label?: string;
  kind?: "triggers" | "guards" | "tests" | "implements" | "docs";
}

export interface Canvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// FSM-specific node properties
export interface FsmNodeProps {
  fsmType: "state" | "guard" | "transition";
  fsmSourcePath?: string;
  fsmStateId?: string;
  isInitial?: boolean;
  allowedPaths?: string[];
  requiredChores?: Array<{
    whenAnyMatches: string[];
    mustAlsoChange: string[];
  }>;
  editable?: boolean;
}

// Canvas store state
export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNode?: CanvasNode;
  selectedEdge?: CanvasEdge;
  mode: 'canvas' | 'fsm';
  zoom: number;
  pan: { x: number; y: number };
}

// Navigation and drill-down
export interface NavigationState {
  currentCanvas: string;
  navigationStack: string[];
  breadcrumb: string[];
}