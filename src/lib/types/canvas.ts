// Canvas types for the FSM editor

export interface CanvasNode {
  id: string;
  type: "box" | "fsm" | "control" | "doc" | "database" | "text" | "file" | "link" | "group" | 
        "route" | "component" | "store" | "api" | "layout" | 
        "config" | "dependency" | "build-task" | "package" | "service";
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
  
  // Application Development Properties
  appType?: "route" | "component" | "store" | "api" | "layout" | 
            "config" | "dependency" | "build-task" | "package" | "service";
  filePath?: string;
  generatedCode?: string;
  dependencies?: string[];
  
  // Route Properties
  routePath?: string; 
  routeParams?: Record<string, string>;
  
  // Component Properties
  componentProps?: Record<string, unknown>; 
  componentSlots?: string[];
  componentEvents?: string[];
  
  // Store Properties
  storeType?: "writable" | "readable" | "derived"; 
  initialState?: unknown;
  
  // API Properties
  apiMethod?: "GET" | "POST" | "PUT" | "DELETE"; 
  apiEndpoint?: string;
  apiSchema?: Record<string, unknown>;
  
  // Config Properties (package.json, vite.config.ts, etc.)
  configType?: "package" | "vite" | "typescript" | "svelte" | "eslint" | "prettier";
  configContent?: Record<string, unknown>;
  
  // Package/Dependency Properties
  packageName?: string;
  packageVersion?: string;
  packageType?: "dependency" | "devDependency" | "peerDependency";
  
  // Build Task Properties
  taskName?: string;
  taskCommand?: string;
  taskDependsOn?: string[];
  
  // Service Properties (external APIs, databases, etc.)
  serviceType?: "database" | "api" | "auth" | "storage";
  serviceConfig?: Record<string, unknown>;
}

export interface CanvasEdge {
  id?: string;
  from?: string;
  to?: string;
  fromNode?: string;
  toNode?: string;
  label?: string;
  kind?: "triggers" | "guards" | "tests" | "implements" | "docs" | "navigation" | "data" | 
         "event" | "api" | "dependency" | "imports" | "configures" | "builds" | "serves";
  
  // Application Development Properties
  flowType?: "navigation" | "data" | "event" | "api" | "dependency" | "import" | 
            "configuration" | "build" | "deployment";
  implementation?: string;
  conditions?: string[];
  middleware?: string[];
  
  // Import/Dependency Properties
  importType?: "default" | "named" | "namespace" | "dynamic";
  importSpecifiers?: string[];
  
  // Configuration Properties
  configKey?: string;
  configValue?: unknown;
  
  // Build Properties
  buildOrder?: number;
  buildConditions?: string[];
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