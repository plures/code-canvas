#!/usr/bin/env -S deno run -A
/**
 * JSON Canvas Compatibility Layer
 * 
 * Provides conversion between Code Canvas YAML format and JSON Canvas standard format.
 * Supports both directions while preserving semantic information where possible.
 */

// Standard JSON Canvas types
export interface JSONCanvasNode {
  id: string;
  type: "text" | "file" | "link" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  
  // Type-specific properties
  text?: string;           // text nodes
  file?: string;           // file nodes
  subpath?: string;        // file nodes
  url?: string;            // link nodes
  label?: string;          // group nodes
  background?: string;     // group nodes
  backgroundStyle?: "cover" | "ratio" | "repeat"; // group nodes
}

export interface JSONCanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: "top" | "right" | "bottom" | "left";
  toSide?: "top" | "right" | "bottom" | "left";
  fromEnd?: "none" | "arrow";
  toEnd?: "none" | "arrow";
  color?: string;
  label?: string;
}

export interface JSONCanvas {
  nodes: JSONCanvasNode[];
  edges: JSONCanvasEdge[];
}

// Extended format supporting both JSON Canvas and Code Canvas features
export interface ExtendedCanvasNode {
  id: string;
  type: "text" | "file" | "link" | "group" | "box" | "fsm" | "control" | "doc" | "database";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  
  // JSON Canvas type-specific properties
  text?: string;           // text nodes
  file?: string;           // file nodes
  subpath?: string;        // file nodes
  url?: string;            // link nodes
  label?: string;          // group nodes or display name
  background?: string;     // group nodes
  backgroundStyle?: "cover" | "ratio" | "repeat"; // group nodes
  
  // Code Canvas extensions
  w?: number;              // backward compatibility
  h?: number;              // backward compatibility
  props?: Record<string, unknown>;
  ref?: string;
}

export interface ExtendedCanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: "top" | "right" | "bottom" | "left";
  toSide?: "top" | "right" | "bottom" | "left";
  fromEnd?: "none" | "arrow";
  toEnd?: "none" | "arrow";
  color?: string;
  label?: string;
  
  // Code Canvas extensions  
  from?: string;           // backward compatibility
  to?: string;             // backward compatibility
  kind?: "triggers" | "guards" | "tests" | "implements" | "docs";
}

export interface ExtendedCanvas {
  nodes: ExtendedCanvasNode[];
  edges: ExtendedCanvasEdge[];
}

// Legacy Code Canvas format
export interface CodeCanvasNode {
  id: string;
  type: "box" | "fsm" | "control" | "doc" | "database";
  label?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props?: Record<string, unknown>;
  ref?: string;
}

export interface CodeCanvasEdge {
  from: string;
  to: string;
  label?: string;
  kind?: "triggers" | "guards" | "tests" | "implements" | "docs";
}

export interface CodeCanvas {
  nodes: CodeCanvasNode[];
  edges: CodeCanvasEdge[];
}

/**
 * Convert Code Canvas format to JSON Canvas standard format
 */
export function codeCanvasToJSONCanvas(codeCanvas: CodeCanvas): JSONCanvas {
  const nodes: JSONCanvasNode[] = codeCanvas.nodes.map((node, index) => {
    let jsonNode: JSONCanvasNode;
    
    // Convert semantic types to JSON Canvas types
    switch (node.type) {
      case "doc":
        jsonNode = {
          id: node.id,
          type: "file",
          x: node.x,
          y: node.y,
          width: node.w,
          height: node.h,
          file: node.ref || `${node.id}.md`,
        };
        if (node.label) jsonNode.label = node.label;
        break;
        
      case "fsm":
      case "control":
      case "database":
      case "box":
      default:
        // Convert to text node with type information
        const typeLabel = node.type.toUpperCase();
        const content = node.label || node.id;
        jsonNode = {
          id: node.id,
          type: "text",
          x: node.x,
          y: node.y,
          width: node.w,
          height: node.h,
          text: `**${typeLabel}**\n\n${content}${node.ref ? `\n\nRef: ${node.ref}` : ''}`,
        };
        
        // Add semantic color coding
        const colorMap: Record<string, string> = {
          fsm: "6",      // purple
          control: "4",  // green  
          database: "1", // red
          doc: "2",      // orange
          box: "5"       // cyan
        };
        jsonNode.color = colorMap[node.type] || "5";
        break;
    }
    
    return jsonNode;
  });
  
  const edges: JSONCanvasEdge[] = codeCanvas.edges.map((edge, index) => ({
    id: `edge-${index}`,
    fromNode: edge.from,
    toNode: edge.to,
    label: edge.label,
    toEnd: "arrow",
    fromEnd: "none",
    // Map semantic edge types to colors
    color: edge.kind ? {
      triggers: "1",    // red
      guards: "4",      // green
      tests: "3",       // yellow
      implements: "2",  // orange
      docs: "6"         // purple
    }[edge.kind] || "5" : "5"
  }));
  
  return { nodes, edges };
}

/**
 * Convert JSON Canvas to Code Canvas format (with information loss)
 */
export function jsonCanvasToCodeCanvas(jsonCanvas: JSONCanvas): CodeCanvas {
  const nodes: CodeCanvasNode[] = jsonCanvas.nodes.map(node => {
    let codeNode: CodeCanvasNode;
    
    // Convert JSON Canvas types to semantic types
    switch (node.type) {
      case "file":
        codeNode = {
          id: node.id,
          type: "doc",
          x: node.x,
          y: node.y,
          w: node.width,
          h: node.height,
          label: node.label,
          ref: node.file,
        };
        break;
        
      case "link":
        codeNode = {
          id: node.id,
          type: "box",
          x: node.x,
          y: node.y,
          w: node.width,
          h: node.height,
          label: node.url,
          props: { url: node.url },
        };
        break;
        
      case "group":
        codeNode = {
          id: node.id,
          type: "box",
          x: node.x,
          y: node.y,
          w: node.width,
          h: node.height,
          label: node.label,
          props: { 
            isGroup: true,
            background: node.background,
            backgroundStyle: node.backgroundStyle
          },
        };
        break;
        
      case "text":
      default:
        // Try to detect semantic type from text content
        const text = node.text || "";
        let detectedType: CodeCanvasNode["type"] = "box";
        
        if (text.includes("**FSM**") || text.includes("State")) {
          detectedType = "fsm";
        } else if (text.includes("**CONTROL**") || text.includes("Button") || text.includes("Input")) {
          detectedType = "control";
        } else if (text.includes("**DATABASE**") || text.includes("DB") || text.includes("Store")) {
          detectedType = "database";
        } else if (text.includes("**DOC**") || text.includes("Design") || text.includes("Spec")) {
          detectedType = "doc";
        }
        
        // Extract label from markdown text
        const lines = text.split('\n').filter(l => l.trim());
        const firstLine = lines[0]?.replace(/\*\*/g, '').trim() || node.id;
        const label = lines[1]?.trim() || firstLine;
        
        codeNode = {
          id: node.id,
          type: detectedType,
          x: node.x,
          y: node.y,
          w: node.width,
          h: node.height,
          label: label !== node.id ? label : undefined,
        };
        
        // Extract ref from text
        const refMatch = text.match(/Ref: (.+)/);
        if (refMatch) {
          codeNode.ref = refMatch[1];
        }
        break;
    }
    
    return codeNode;
  });
  
  const edges: CodeCanvasEdge[] = jsonCanvas.edges.map(edge => {
    // Try to detect semantic edge type from color or label
    let kind: CodeCanvasEdge["kind"];
    if (edge.color) {
      const kindMap: Record<string, CodeCanvasEdge["kind"]> = {
        "1": "triggers",
        "2": "implements", 
        "3": "tests",
        "4": "guards",
        "6": "docs"
      };
      kind = kindMap[edge.color];
    }
    
    // Detect from label
    if (!kind && edge.label) {
      const label = edge.label.toLowerCase();
      if (label.includes("trigger")) kind = "triggers";
      else if (label.includes("guard")) kind = "guards";
      else if (label.includes("test")) kind = "tests";
      else if (label.includes("implement")) kind = "implements";
      else if (label.includes("doc")) kind = "docs";
    }
    
    return {
      from: edge.fromNode,
      to: edge.toNode,
      label: edge.label,
      kind,
    };
  });
  
  return { nodes, edges };
}

/**
 * Detect whether a canvas is in JSON Canvas or Code Canvas format
 */
export function detectFormat(canvas: any): 'jsoncanvas' | 'codecanvas' {
  return isJSONCanvasFormat(canvas) ? 'jsoncanvas' : 'codecanvas';
}

/**
 * Normalize canvas to extended format (supports both JSON Canvas and Code Canvas features)
 */
export function normalizeCanvas(canvas: CodeCanvas | JSONCanvas | ExtendedCanvas): ExtendedCanvas {
  const nodes: ExtendedCanvasNode[] = canvas.nodes.map(node => {
    // Handle legacy Code Canvas format
    if ('w' in node && 'h' in node) {
      const legacyNode = node as CodeCanvasNode;
      return {
        ...legacyNode,
        width: legacyNode.w,
        height: legacyNode.h,
        type: legacyNode.type as ExtendedCanvasNode["type"],
      };
    }
    
    // Handle standard JSON Canvas format or already extended
    return {
      ...node,
      w: node.width,  // Add backward compatibility
      h: node.height,
    } as ExtendedCanvasNode;
  });
  
  const edges: ExtendedCanvasEdge[] = canvas.edges.map(edge => {
    // Handle legacy Code Canvas format  
    if ('from' in edge && 'to' in edge && !('fromNode' in edge)) {
      const legacyEdge = edge as CodeCanvasEdge;
      return {
        id: `${legacyEdge.from}-${legacyEdge.to}`,
        fromNode: legacyEdge.from,
        toNode: legacyEdge.to,
        label: legacyEdge.label,
        kind: legacyEdge.kind,
        from: legacyEdge.from,  // Backward compatibility
        to: legacyEdge.to,
        toEnd: "arrow",
        fromEnd: "none",
      };
    }
    
    // Handle standard JSON Canvas format or already extended
    return {
      ...edge,
      from: edge.fromNode,    // Add backward compatibility
      to: edge.toNode,
    } as ExtendedCanvasEdge;
  });
  
  return { nodes, edges };
}

/**
 * Check if canvas uses JSON Canvas standard format
 */
export function isJSONCanvasFormat(canvas: any): canvas is JSONCanvas {
  if (!canvas.nodes || !Array.isArray(canvas.nodes)) return false;
  if (canvas.nodes.length === 0) return true;
  
  const firstNode = canvas.nodes[0];
  return 'width' in firstNode && 'height' in firstNode && 
         ['text', 'file', 'link', 'group'].includes(firstNode.type);
}

/**
 * Check if canvas uses Code Canvas format  
 */
export function isCodeCanvasFormat(canvas: any): canvas is CodeCanvas {
  if (!canvas.nodes || !Array.isArray(canvas.nodes)) return false;
  if (canvas.nodes.length === 0) return true;
  
  const firstNode = canvas.nodes[0];
  return 'w' in firstNode && 'h' in firstNode &&
         ['box', 'fsm', 'control', 'doc', 'database'].includes(firstNode.type);
}