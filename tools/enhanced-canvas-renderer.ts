#!/usr/bin/env -S deno run -A
/**
 * Enhanced Canvas Renderer with JSON Canvas Support
 * 
 * Renders canvases supporting both Code Canvas semantic types and JSON Canvas standard types.
 * Includes support for colors, edge positioning, text nodes, file nodes, link nodes, and groups.
 */

import { ExtendedCanvas, ExtendedCanvasNode, ExtendedCanvasEdge, normalizeCanvas } from "./jsoncanvas-compat.ts";

// Color mapping for JSON Canvas preset colors
const PRESET_COLORS = {
  "1": "#ff6b6b", // red
  "2": "#ffa726", // orange  
  "3": "#ffeb3b", // yellow
  "4": "#66bb6a", // green
  "5": "#42a5f5", // cyan/blue
  "6": "#ab47bc", // purple
};

// Enhanced node styles supporting both semantic and JSON Canvas types
const NODE_STYLES: Record<string, { fill: string; stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  // Code Canvas semantic types
  box: { fill: "#e1f5fe", stroke: "#01579b", strokeWidth: 2 },
  fsm: { fill: "#f3e5f5", stroke: "#4a148c", strokeWidth: 3 },
  control: { fill: "#e8f5e8", stroke: "#1b5e20", strokeWidth: 2 },
  doc: { fill: "#fff3e0", stroke: "#e65100", strokeWidth: 2 },
  database: { fill: "#fce4ec", stroke: "#880e4f", strokeWidth: 2 },
  
  // JSON Canvas standard types
  text: { fill: "#ffffff", stroke: "#666666", strokeWidth: 1 },
  file: { fill: "#f0f8ff", stroke: "#4169e1", strokeWidth: 2 },
  link: { fill: "#f0fff0", stroke: "#32cd32", strokeWidth: 2 },
  group: { fill: "transparent", stroke: "#999999", strokeWidth: 2, strokeDasharray: "5,5" },
};

// Enhanced edge styles
const EDGE_STYLES = {
  // Code Canvas semantic types
  triggers: { stroke: "#d32f2f", strokeDasharray: "5,5" },
  guards: { stroke: "#1976d2", strokeDasharray: "10,2" },
  tests: { stroke: "#388e3c", strokeDasharray: "3,3" },
  implements: { stroke: "#f57c00", strokeDasharray: "none" },
  docs: { stroke: "#7b1fa2", strokeDasharray: "8,4" },
  
  // Default
  default: { stroke: "#666666", strokeDasharray: "none" },
};

export class EnhancedCanvasRenderer {
  private canvas: ExtendedCanvas;
  private canvasWidth = 0;
  private canvasHeight = 0;

  constructor(canvas: any) {
    this.canvas = normalizeCanvas(canvas);
    this.calculateBounds();
  }

  private calculateBounds(): void {
    if (this.canvas.nodes.length === 0) {
      this.canvasWidth = 800;
      this.canvasHeight = 600;
      return;
    }

    let maxX = 0;
    let maxY = 0;

    for (const node of this.canvas.nodes) {
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }

    this.canvasWidth = maxX + 40;
    this.canvasHeight = maxY + 40;
  }

  private getNodeColor(node: ExtendedCanvasNode): { fill: string; stroke: string } {
    const baseStyle = NODE_STYLES[node.type] || NODE_STYLES.box;
    
    if (node.color) {
      // Handle preset colors
      if (PRESET_COLORS[node.color as keyof typeof PRESET_COLORS]) {
        const color = PRESET_COLORS[node.color as keyof typeof PRESET_COLORS];
        return {
          fill: color + "20", // Add transparency
          stroke: color,
        };
      }
      
      // Handle hex colors
      if (node.color.startsWith("#")) {
        return {
          fill: node.color + "20",
          stroke: node.color,
        };
      }
    }
    
    return baseStyle;
  }

  private getEdgeColor(edge: ExtendedCanvasEdge): string {
    if (edge.color) {
      // Handle preset colors
      if (PRESET_COLORS[edge.color as keyof typeof PRESET_COLORS]) {
        return PRESET_COLORS[edge.color as keyof typeof PRESET_COLORS];
      }
      
      // Handle hex colors
      if (edge.color.startsWith("#")) {
        return edge.color;
      }
    }
    
    // Use semantic color from kind
    if (edge.kind && EDGE_STYLES[edge.kind]) {
      return EDGE_STYLES[edge.kind].stroke;
    }
    
    return EDGE_STYLES.default.stroke;
  }

  private renderNode(node: ExtendedCanvasNode): string {
    const style = this.getNodeColor(node);
    const strokeWidth = NODE_STYLES[node.type]?.strokeWidth || 2;
    const strokeDasharray = NODE_STYLES[node.type]?.strokeDasharray;
    
    let content = "";
    let nodeClass = `node node-${node.type}`;
    
    // Handle different node types
    switch (node.type) {
      case "text":
        content = this.renderTextContent(node);
        break;
        
      case "file":
        content = this.renderFileContent(node);
        nodeClass += " file-node";
        break;
        
      case "link":
        content = this.renderLinkContent(node);
        nodeClass += " link-node";
        break;
        
      case "group":
        return this.renderGroupNode(node);
        
      default:
        // Code Canvas semantic types
        content = this.renderSemanticContent(node);
        break;
    }

    const rect = `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"
          fill="${style.fill}" stroke="${style.stroke}" stroke-width="${strokeWidth}" rx="5"
          ${strokeDasharray ? `stroke-dasharray="${strokeDasharray}"` : ''}/>`;

    return `<g class="${nodeClass}" id="node-${node.id}" data-x="${node.x}" data-y="${node.y}">
      ${rect}
      ${content}
    </g>`;
  }

  private renderTextContent(node: ExtendedCanvasNode): string {
    if (!node.text) return "";
    
    // Simple markdown rendering for text nodes
    const lines = node.text.split('\n');
    const textElements: string[] = [];
    let yOffset = 20;
    
    for (const line of lines) {
      if (line.trim() === "") {
        yOffset += 16;
        continue;
      }
      
      let fontSize = "14";
      let fontWeight = "normal";
      let text = line;
      
      // Handle markdown formatting
      if (line.startsWith("# ")) {
        text = line.substring(2);
        fontSize = "18";
        fontWeight = "bold";
      } else if (line.startsWith("## ")) {
        text = line.substring(3);
        fontSize = "16";
        fontWeight = "bold";
      } else if (line.includes("**") && line.indexOf("**") !== line.lastIndexOf("**")) {
        text = line.replace(/\*\*/g, "");
        fontWeight = "bold";
      }
      
      textElements.push(`<text x="${node.x + 10}" y="${node.y + yOffset}" 
        font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" 
        fill="#333">${text}</text>`);
      
      yOffset += parseInt(fontSize) + 4;
    }
    
    return textElements.join('\n');
  }

  private renderFileContent(node: ExtendedCanvasNode): string {
    const fileName = node.file || "file";
    const displayName = node.label || fileName.split('/').pop() || fileName;
    
    // File icon
    const icon = `<text x="${node.x + 10}" y="${node.y + 25}" 
      font-family="Arial, sans-serif" font-size="20" fill="#4169e1">📄</text>`;
    
    // File name
    const nameText = `<text x="${node.x + 40}" y="${node.y + 25}" 
      text-anchor="start" dominant-baseline="middle"
      font-family="Arial, sans-serif" font-size="14" font-weight="600" 
      fill="#333">${displayName}</text>`;
    
    // File path (if different from display name)
    const pathText = fileName !== displayName ? 
      `<text x="${node.x + 40}" y="${node.y + 45}" 
        font-family="Arial, sans-serif" font-size="11" fill="#666">${fileName}</text>` : "";
    
    return icon + nameText + pathText;
  }

  private renderLinkContent(node: ExtendedCanvasNode): string {
    const url = node.url || "";
    const displayText = node.label || url;
    
    // Link icon
    const icon = `<text x="${node.x + 10}" y="${node.y + 25}" 
      font-family="Arial, sans-serif" font-size="16" fill="#32cd32">🔗</text>`;
    
    // Link text
    const linkText = `<text x="${node.x + 35}" y="${node.y + 25}" 
      text-anchor="start" dominant-baseline="middle"
      font-family="Arial, sans-serif" font-size="14" fill="#0066cc" 
      text-decoration="underline">${displayText}</text>`;
    
    return icon + linkText;
  }

  private renderSemanticContent(node: ExtendedCanvasNode): string {
    const label = node.label || node.id;
    const typeIcons: Record<string, string> = {
      fsm: "⚡",
      control: "🎛️", 
      database: "🗄️",
      doc: "📋",
      box: "📦",
      text: "📝",
      file: "📄",
      link: "🔗",
      group: "📁",
    };
    const typeIcon = typeIcons[node.type] || "📦";
    
    return `<text x="${node.x + node.width/2}" y="${node.y + node.height/2}" 
      text-anchor="middle" dominant-baseline="middle"
      font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#333">
      <tspan>${typeIcon}</tspan>
      <tspan x="${node.x + node.width/2}" dy="20">${label}</tspan>
    </text>`;
  }

  private renderGroupNode(node: ExtendedCanvasNode): string {
    const style = this.getNodeColor(node);
    
    // Group background
    let background = "";
    if (node.background) {
      // Simple background support
      background = `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" 
        fill="url(#bg-${node.id})" opacity="0.3"/>`;
    }
    
    // Group border
    const border = `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"
      fill="transparent" stroke="${style.stroke}" stroke-width="2" 
      stroke-dasharray="8,4" rx="8"/>`;
    
    // Group label
    const label = node.label ? 
      `<text x="${node.x + 10}" y="${node.y - 5}" 
        font-family="Arial, sans-serif" font-size="12" font-weight="bold" 
        fill="${style.stroke}">${node.label}</text>` : "";
    
    return `<g class="node node-group" id="node-${node.id}">
      ${background}
      ${border}
      ${label}
    </g>`;
  }

  private calculateEdgePoints(edge: ExtendedCanvasEdge): { x1: number; y1: number; x2: number; y2: number } {
    const fromNode = this.canvas.nodes.find(n => n.id === edge.fromNode);
    const toNode = this.canvas.nodes.find(n => n.id === edge.toNode);
    
    if (!fromNode || !toNode) {
      return { x1: 0, y1: 0, x2: 0, y2: 0 };
    }

    // Calculate connection points based on fromSide/toSide if specified
    let x1: number, y1: number, x2: number, y2: number;
    
    // From point
    switch (edge.fromSide) {
      case "top":
        x1 = fromNode.x + fromNode.width / 2;
        y1 = fromNode.y;
        break;
      case "right":
        x1 = fromNode.x + fromNode.width;
        y1 = fromNode.y + fromNode.height / 2;
        break;
      case "bottom":
        x1 = fromNode.x + fromNode.width / 2;
        y1 = fromNode.y + fromNode.height;
        break;
      case "left":
        x1 = fromNode.x;
        y1 = fromNode.y + fromNode.height / 2;
        break;
      default:
        // Auto-calculate center
        x1 = fromNode.x + fromNode.width / 2;
        y1 = fromNode.y + fromNode.height / 2;
        break;
    }
    
    // To point
    switch (edge.toSide) {
      case "top":
        x2 = toNode.x + toNode.width / 2;
        y2 = toNode.y;
        break;
      case "right":
        x2 = toNode.x + toNode.width;
        y2 = toNode.y + toNode.height / 2;
        break;
      case "bottom":
        x2 = toNode.x + toNode.width / 2;
        y2 = toNode.y + toNode.height;
        break;
      case "left":
        x2 = toNode.x;
        y2 = toNode.y + toNode.height / 2;
        break;
      default:
        // Auto-calculate center
        x2 = toNode.x + toNode.width / 2;
        y2 = toNode.y + toNode.height / 2;
        break;
    }
    
    return { x1, y1, x2, y2 };
  }

  private renderEdge(edge: ExtendedCanvasEdge): string {
    const points = this.calculateEdgePoints(edge);
    if (points.x1 === 0 && points.y1 === 0) return ""; // Invalid edge
    
    const color = this.getEdgeColor(edge);
    const style = edge.kind ? EDGE_STYLES[edge.kind] : EDGE_STYLES.default;
    const dashArray = style.strokeDasharray !== "none" ? `stroke-dasharray="${style.strokeDasharray}"` : "";
    
    // Line
    const line = `<line x1="${points.x1}" y1="${points.y1}" x2="${points.x2}" y2="${points.y2}" 
      stroke="${color}" stroke-width="2" ${dashArray}/>`;
    
    // Arrows
    let arrows = "";
    
    // From arrow
    if (edge.fromEnd === "arrow") {
      const angle1 = Math.atan2(points.y2 - points.y1, points.x2 - points.x1);
      const size = 10;
      const ax1 = points.x1 + size * Math.cos(angle1 - Math.PI / 6);
      const ay1 = points.y1 + size * Math.sin(angle1 - Math.PI / 6);
      const ax2 = points.x1 + size * Math.cos(angle1 + Math.PI / 6);
      const ay2 = points.y1 + size * Math.sin(angle1 + Math.PI / 6);
      
      arrows += `<polygon points="${points.x1},${points.y1} ${ax1},${ay1} ${ax2},${ay2}" fill="${color}"/>`;
    }
    
    // To arrow
    if (edge.toEnd === "arrow" || edge.toEnd === undefined) {
      const angle2 = Math.atan2(points.y2 - points.y1, points.x2 - points.x1);
      const size = 10;
      const ax1 = points.x2 - size * Math.cos(angle2 - Math.PI / 6);
      const ay1 = points.y2 - size * Math.sin(angle2 - Math.PI / 6);
      const ax2 = points.x2 - size * Math.cos(angle2 + Math.PI / 6);
      const ay2 = points.y2 - size * Math.sin(angle2 + Math.PI / 6);
      
      arrows += `<polygon points="${points.x2},${points.y2} ${ax1},${ay1} ${ax2},${ay2}" fill="${color}"/>`;
    }
    
    // Label
    const label = edge.label ? 
      `<text x="${(points.x1 + points.x2) / 2}" y="${(points.y1 + points.y2) / 2 - 5}" 
        text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${color}">${edge.label}</text>` : "";
    
    return `<g class="edge edge-${edge.kind || 'default'}" id="edge-${edge.id}">
      ${line}
      ${arrows}
      ${label}
    </g>`;
  }

  public renderSVG(): string {
    // Sort nodes by type (groups first, then others)
    const sortedNodes = [...this.canvas.nodes].sort((a, b) => {
      if (a.type === "group" && b.type !== "group") return -1;
      if (a.type !== "group" && b.type === "group") return 1;
      return 0;
    });

    const nodes = sortedNodes.map(node => this.renderNode(node)).join('\n');
    const edges = this.canvas.edges.map(edge => this.renderEdge(edge)).join('\n');

    return `<svg width="${this.canvasWidth}" height="${this.canvasHeight}" 
      xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style type="text/css">
      .node { cursor: pointer; }
      .node:hover rect { stroke-width: 4; }
      .node.dragging { opacity: 0.7; }
      .edge { pointer-events: none; }
      text { user-select: none; }
      .file-node:hover { opacity: 0.8; }
      .link-node:hover { opacity: 0.8; cursor: pointer; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="#fafafa" stroke="#e0e0e0"/>
  
  <!-- Edges (behind nodes) -->
  ${edges}
  
  <!-- Nodes (on top) -->
  ${nodes}
</svg>`;
  }

  public renderHTML(title = "Enhanced Canvas"): string {
    const svg = this.renderSVG();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 100%; overflow: auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { margin: 0 0 20px 0; color: #333; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="container">
        ${svg}
    </div>
</body>
</html>`;
  }
}