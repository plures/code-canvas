#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Canvas Rendering Engine
 *
 * Transforms YAML canvas definitions into visual SVG/HTML representations.
 * Supports all canvas node types and edge relationships with proper styling.
 */

import { join } from "jsr:@std/path@^1.0/join";
import { basename } from "jsr:@std/path@^1.0/basename";
import { ensureDir } from "jsr:@std/fs@^1.0/ensure-dir";
import * as yaml from "jsr:@std/yaml@^1.0";

// Canvas type definitions
interface CanvasNode {
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

interface CanvasEdge {
  from: string;
  to: string;
  label?: string;
  kind?: "triggers" | "guards" | "tests" | "implements" | "docs";
}

interface Canvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// Visual styling configuration
const NODE_STYLES = {
  box: { fill: "#e1f5fe", stroke: "#01579b", strokeWidth: 2 },
  fsm: { fill: "#f3e5f5", stroke: "#4a148c", strokeWidth: 3 },
  control: { fill: "#e8f5e8", stroke: "#1b5e20", strokeWidth: 2 },
  doc: { fill: "#fff3e0", stroke: "#e65100", strokeWidth: 2 },
  database: { fill: "#fce4ec", stroke: "#880e4f", strokeWidth: 2 },
};

const EDGE_STYLES = {
  triggers: { stroke: "#d32f2f", strokeDasharray: "5,5" },
  guards: { stroke: "#1976d2", strokeDasharray: "10,2" },
  tests: { stroke: "#388e3c", strokeDasharray: "3,3" },
  implements: { stroke: "#f57c00", strokeDasharray: "none" },
  docs: { stroke: "#7b1fa2", strokeDasharray: "8,4" },
};

class CanvasRenderer {
  private canvas: Canvas;
  private canvasWidth = 0;
  private canvasHeight = 0;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
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
      maxX = Math.max(maxX, node.x + node.w);
      maxY = Math.max(maxY, node.y + node.h);
    }

    this.canvasWidth = Math.max(800, maxX + 50);
    this.canvasHeight = Math.max(600, maxY + 50);
  }

  private renderNode(node: CanvasNode): string {
    const style = NODE_STYLES[node.type];
    const label = node.label || node.id;

    // Calculate text position (centered)
    const textX = node.x + node.w / 2;
    const textY = node.y + node.h / 2;

    // Add reference indicator if present
    const refIndicator = node.ref
      ? `<circle cx="${node.x + node.w - 10}" cy="${
        node.y + 10
      }" r="4" fill="#666" title="References: ${node.ref}"/>`
      : "";

    return `
    <g class="node node-${node.type}" id="node-${node.id}">
      <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" 
            fill="${style.fill}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" rx="8"/>
      ${refIndicator}
      <text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial, sans-serif" font-size="12" fill="#333">
        ${label}
      </text>
      ${node.type === "fsm" ? this.renderFsmIndicator(node) : ""}
    </g>`;
  }

  private renderFsmIndicator(node: CanvasNode): string {
    // Add special FSM state indicator
    const centerX = node.x + node.w / 2;
    const bottomY = node.y + node.h - 15;
    return `<circle cx="${centerX}" cy="${bottomY}" r="6" fill="#4a148c" stroke="white" stroke-width="2"/>`;
  }

  private renderEdge(edge: CanvasEdge): string {
    const fromNode = this.canvas.nodes.find((n) => n.id === edge.from);
    const toNode = this.canvas.nodes.find((n) => n.id === edge.to);

    if (!fromNode || !toNode) {
      console.warn(`Edge references missing node: ${edge.from} -> ${edge.to}`);
      return "";
    }

    // Calculate connection points (center of nodes)
    const x1 = fromNode.x + fromNode.w / 2;
    const y1 = fromNode.y + fromNode.h / 2;
    const x2 = toNode.x + toNode.w / 2;
    const y2 = toNode.y + toNode.h / 2;

    const style = EDGE_STYLES[edge.kind || "implements"];
    const strokeDashArray = style.strokeDasharray !== "none"
      ? `stroke-dasharray="${style.strokeDasharray}"`
      : "";

    // Create arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 12;
    const arrowAngle = Math.PI / 6;

    const arrowX1 = x2 - arrowLength * Math.cos(angle - arrowAngle);
    const arrowY1 = y2 - arrowLength * Math.sin(angle - arrowAngle);
    const arrowX2 = x2 - arrowLength * Math.cos(angle + arrowAngle);
    const arrowY2 = y2 - arrowLength * Math.sin(angle + arrowAngle);

    // Position label at midpoint
    const labelX = (x1 + x2) / 2;
    const labelY = (y1 + y2) / 2 - 10;

    return `
    <g class="edge edge-${edge.kind || "default"}" id="edge-${edge.from}-${edge.to}">
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
            stroke="${style.stroke}" stroke-width="2" ${strokeDashArray}/>
      <polygon points="${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}" 
               fill="${style.stroke}"/>
      ${
      edge.label
        ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" 
                            font-family="Arial, sans-serif" font-size="10" fill="#666" 
                            background="white">${edge.label}</text>`
        : ""
    }
    </g>`;
  }

  renderSvg(): string {
    const nodes = this.canvas.nodes.map((node) => this.renderNode(node)).join("");
    const edges = this.canvas.edges.map((edge) => this.renderEdge(edge)).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.canvasWidth}" height="${this.canvasHeight}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style type="text/css">
      .node { cursor: pointer; }
      .node:hover rect { stroke-width: 4; }
      .edge { pointer-events: none; }
      text { user-select: none; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="#fafafa" stroke="#e0e0e0"/>
  
  <!-- Edges (behind nodes) -->
  ${edges}
  
  <!-- Nodes (on top) -->
  ${nodes}
  
  <!-- Legend -->
  <g class="legend" transform="translate(20, ${this.canvasHeight - 150})">
    <rect x="0" y="0" width="200" height="120" fill="white" stroke="#ccc" stroke-width="1" rx="5"/>
    <text x="10" y="20" font-family="Arial, sans-serif" font-size="14" font-weight="bold">Legend</text>
    <line x1="10" y1="30" x2="50" y2="30" stroke="#f57c00" stroke-width="2"/>
    <text x="55" y="35" font-family="Arial, sans-serif" font-size="10">implements</text>
    <line x1="10" y1="45" x2="50" y2="45" stroke="#1976d2" stroke-width="2" stroke-dasharray="10,2"/>
    <text x="55" y="50" font-family="Arial, sans-serif" font-size="10">guards</text>
    <line x1="10" y1="60" x2="50" y2="60" stroke="#d32f2f" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="55" y="65" font-family="Arial, sans-serif" font-size="10">triggers</text>
    <line x1="10" y1="75" x2="50" y2="75" stroke="#388e3c" stroke-width="2" stroke-dasharray="3,3"/>
    <text x="55" y="80" font-family="Arial, sans-serif" font-size="10">tests</text>
    <line x1="10" y1="90" x2="50" y2="90" stroke="#7b1fa2" stroke-width="2" stroke-dasharray="8,4"/>
    <text x="55" y="95" font-family="Arial, sans-serif" font-size="10">docs</text>
  </g>
</svg>`;
  }

  renderHtml(svgContent: string, canvasName: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas: ${canvasName}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .canvas-container {
            padding: 20px;
            text-align: center;
        }
        .controls {
            margin: 20px 0;
        }
        button {
            margin: 0 5px;
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #f0f0f0;
        }
        svg {
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            background: white;
        }
        .footer {
            padding: 15px 20px;
            background: #f8f9fa;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 ${canvasName}</h1>
            <p>Interactive project canvas visualization</p>
        </div>
        
        <div class="canvas-container">
            <div class="controls">
                <button onclick="zoomIn()">🔍 Zoom In</button>
                <button onclick="zoomOut()">🔍 Zoom Out</button>
                <button onclick="resetZoom()">↻ Reset</button>
                <button onclick="downloadSvg()">💾 Download SVG</button>
            </div>
            
            <div id="canvas-wrapper" style="overflow: auto; max-height: 80vh;">
                ${svgContent}
            </div>
        </div>
        
        <div class="footer">
            Generated by Code Canvas • ${new Date().toLocaleString()}
        </div>
    </div>

    <script>
        let currentZoom = 1;
        const svg = document.querySelector('svg');
        
        function zoomIn() {
            currentZoom *= 1.2;
            updateZoom();
        }
        
        function zoomOut() {
            currentZoom /= 1.2;
            updateZoom();
        }
        
        function resetZoom() {
            currentZoom = 1;
            updateZoom();
        }
        
        function updateZoom() {
            svg.style.transform = \`scale(\${currentZoom})\`;
            svg.style.transformOrigin = 'top left';
        }
        
        function downloadSvg() {
            const svgData = svg.outerHTML;
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '${canvasName}.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Add click handlers for nodes
        document.querySelectorAll('.node').forEach(node => {
            node.addEventListener('click', function() {
                const nodeId = this.id.replace('node-', '');
                console.log('Clicked node:', nodeId);
                // Could integrate with VS Code to open referenced files
            });
        });
    </script>
</body>
</html>`;
  }
}

// Main rendering function
export async function renderCanvas(canvasPath: string, outputDir: string): Promise<void> {
  try {
    console.log(`🎨 Rendering canvas: ${canvasPath}`);

    // Read and parse canvas YAML
    const canvasYaml = await Deno.readTextFile(canvasPath);
    const canvas = yaml.parse(canvasYaml) as Canvas;

    // Validate canvas structure
    if (!canvas.nodes || !canvas.edges) {
      throw new Error("Invalid canvas: missing required 'nodes' or 'edges' arrays");
    }

    // Create renderer
    const renderer = new CanvasRenderer(canvas);

    // Generate SVG
    const svgContent = renderer.renderSvg();

    // Generate HTML wrapper
    const canvasName = basename(canvasPath, ".canvas.yaml");
    const htmlContent = renderer.renderHtml(svgContent, canvasName);

    // Ensure output directory exists
    await ensureDir(outputDir);

    // Write output files
    const svgPath = join(outputDir, `${canvasName}.svg`);
    const htmlPath = join(outputDir, `${canvasName}.html`);

    await Deno.writeTextFile(svgPath, svgContent);
    await Deno.writeTextFile(htmlPath, htmlContent);

    console.log(`✅ Rendered to:`);
    console.log(`   SVG:  ${svgPath}`);
    console.log(`   HTML: ${htmlPath}`);
  } catch (error) {
    console.error(
      `❌ Error rendering canvas ${canvasPath}:`,
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }
}

// CLI interface
if (import.meta.main) {
  const args = Deno.args;

  if (args.length === 0) {
    console.log(`🎨 Canvas Renderer
    
Usage:
  deno run --allow-read --allow-write tools/canvas-renderer.ts <canvas-file> [output-dir]
  deno run --allow-read --allow-write tools/canvas-renderer.ts --all [output-dir]
  
Examples:
  deno run --allow-read --allow-write tools/canvas-renderer.ts sot/canvas/demo.canvas.yaml
  deno run --allow-read --allow-write tools/canvas-renderer.ts --all output
`);
    Deno.exit(1);
  }

  const outputDir = args[1] || "output";

  if (args[0] === "--all") {
    // Render all canvas files
    console.log("🎨 Rendering all canvas files...");

    try {
      for await (const entry of Deno.readDir("sot/canvas")) {
        if (entry.isFile && entry.name.endsWith(".canvas.yaml")) {
          const canvasPath = join("sot/canvas", entry.name);
          await renderCanvas(canvasPath, outputDir);
        }
      }
      console.log("🎉 All canvases rendered successfully!");
    } catch (error) {
      console.error(
        "❌ Error rendering canvases:",
        error instanceof Error ? error.message : String(error),
      );
      Deno.exit(1);
    }
  } else {
    // Render specific canvas file
    await renderCanvas(args[0], outputDir);
  }
}
