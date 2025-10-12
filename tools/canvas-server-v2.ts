#!/usr/bin/env -S deno run -A
/**
 * Canvas Server V2 - Interactive canvas editor with FSM awareness
 * Obsidian Canvas-inspired editing with Code Canvas enhancements
 */

import { parseArgs } from "jsr:@std/cli/parse-args";
import { join } from "jsr:@std/path/join";
import { exists } from "jsr:@std/fs/exists";
import * as yaml from "jsr:@std/yaml";

const DEFAULT_PORT = 8080;
const CANVAS_DIR = "sot/canvas";
const GRID_SIZE = 20;

interface CanvasNode {
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
  props?: Record<string, unknown>;
  ref?: string;
}

interface CanvasEdge {
  from?: string;
  to?: string;
  fromNode?: string;
  toNode?: string;
  label?: string;
  kind?: "triggers" | "guards" | "tests" | "implements" | "docs";
}

interface Canvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface ServerOptions {
  port: number;
  file?: string;
  watch: boolean;
}

const NODE_STYLES = {
  box: { fill: "#e1f5fe", stroke: "#01579b", strokeWidth: 2 },
  fsm: { fill: "#f3e5f5", stroke: "#4a148c", strokeWidth: 3 },
  control: { fill: "#e8f5e8", stroke: "#1b5e20", strokeWidth: 2 },
  doc: { fill: "#fff3e0", stroke: "#e65100", strokeWidth: 2 },
  database: { fill: "#fce4ec", stroke: "#880e4f", strokeWidth: 2 },
  text: { fill: "#fff3e0", stroke: "#e65100", strokeWidth: 2 },
  file: { fill: "#e8f5e8", stroke: "#1b5e20", strokeWidth: 2 },
  link: { fill: "#e1f5fe", stroke: "#01579b", strokeWidth: 2 },
  group: { fill: "#f5f5f5", stroke: "#757575", strokeWidth: 1 }
};

const EDGE_STYLES = {
  triggers: { stroke: "#d32f2f", dash: "5,5" },
  guards: { stroke: "#1976d2", dash: "10,2" },
  tests: { stroke: "#388e3c", dash: "3,3" },
  implements: { stroke: "#f57c00", dash: "none" },
  docs: { stroke: "#7b1fa2", dash: "8,4" }
};

function renderCanvasToSvg(canvas: Canvas): string {
  let maxX = 800, maxY = 600;
  if (canvas.nodes.length > 0) {
    maxX = Math.max(...canvas.nodes.map(n => n.x + (n.w || n.width || 120))) + 40;
    maxY = Math.max(...canvas.nodes.map(n => n.y + (n.h || n.height || 60))) + 40;
  }

  const renderNode = (node: CanvasNode) => {
    const style = NODE_STYLES[node.type] || NODE_STYLES.box;
    const label = node.label || node.text || node.id;
    const width = node.w || node.width || 120;
    const height = node.h || node.height || 60;
    const fill = node.color || style.fill;
    
    return `<g class="node node-${node.type}" id="node-${node.id}" data-x="${node.x}" data-y="${node.y}" data-w="${width}" data-h="${height}">
      <rect x="${node.x}" y="${node.y}" width="${width}" height="${height}"
            fill="${fill}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" rx="5"/>
      <text x="${node.x + width/2}" y="${node.y + height/2}" 
            text-anchor="middle" dominant-baseline="middle"
            font-family="Arial" font-size="14" font-weight="600" data-node-id="${node.id}">${label}</text>
      <!-- Resize handles -->
      <rect class="resize-handle corner nw" data-node-id="${node.id}" data-handle="nw"
            x="${node.x - 4}" y="${node.y - 4}" width="8" height="8" rx="1"/>
      <rect class="resize-handle corner se" data-node-id="${node.id}" data-handle="se"
            x="${node.x + width - 4}" y="${node.y + height - 4}" width="8" height="8" rx="1"/>
      <rect class="resize-handle edge-right" data-node-id="${node.id}" data-handle="e"
            x="${node.x + width - 4}" y="${node.y + height/2 - 4}" width="8" height="8" rx="1"/>
      <rect class="resize-handle edge-bottom" data-node-id="${node.id}" data-handle="s"
            x="${node.x + width/2 - 4}" y="${node.y + height - 4}" width="8" height="8" rx="1"/>
    </g>`;
  };

  const renderEdge = (edge: CanvasEdge, index: number) => {
    const fromId = edge.from || edge.fromNode;
    const toId = edge.to || edge.toNode;
    const from = canvas.nodes.find(n => n.id === fromId);
    const to = canvas.nodes.find(n => n.id === toId);
    if (!from || !to) return '';

    const fromWidth = from.w || from.width || 120;
    const fromHeight = from.h || from.height || 60;
    const toWidth = to.w || to.width || 120;
    const toHeight = to.h || to.height || 60;
    
    // Calculate center points first
    const fromCenterX = from.x + fromWidth / 2;
    const fromCenterY = from.y + fromHeight / 2;
    const toCenterX = to.x + toWidth / 2;
    const toCenterY = to.y + toHeight / 2;
    
    // Calculate connection points on node borders
    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;
    const angle = Math.atan2(dy, dx);
    
    // From node border connection point
    let x1, y1;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection (left/right sides)
      x1 = dx > 0 ? from.x + fromWidth : from.x;
      y1 = fromCenterY + (dy / Math.abs(dx)) * (fromWidth / 2);
    } else {
      // Vertical connection (top/bottom sides)
      x1 = fromCenterX + (dx / Math.abs(dy)) * (fromHeight / 2);
      y1 = dy > 0 ? from.y + fromHeight : from.y;
    }
    
    // To node border connection point
    let x2, y2;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection (left/right sides)
      x2 = dx > 0 ? to.x : to.x + toWidth;
      y2 = toCenterY - (dy / Math.abs(dx)) * (toWidth / 2);
    } else {
      // Vertical connection (top/bottom sides)
      x2 = toCenterX - (dx / Math.abs(dy)) * (toHeight / 2);
      y2 = dy > 0 ? to.y : to.y + toHeight;
    }
    
    const style = EDGE_STYLES[edge.kind || 'implements'];
    const dashAttr = style.dash !== 'none' ? `stroke-dasharray="${style.dash}"` : '';
    
    // Calculate arrow head
    const arrowAngle = Math.atan2(y2 - y1, x2 - x1);
    const size = 10;
    const ax1 = x2 - size * Math.cos(arrowAngle - Math.PI / 6);
    const ay1 = y2 - size * Math.sin(arrowAngle - Math.PI / 6);
    const ax2 = x2 - size * Math.cos(arrowAngle + Math.PI / 6);
    const ay2 = y2 - size * Math.sin(arrowAngle + Math.PI / 6);

    return `<g class="edge edge-${edge.kind || 'default'}" id="edge-${fromId}-${toId}" 
               data-from="${fromId}" data-to="${toId}" data-kind="${edge.kind || 'implements'}" data-edge-index="${index}">
      <!-- Invisible clickable line with larger hit area -->
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(0,0,0,0)" stroke-width="12"/>
      <!-- Visual line -->
      <line class="edge-visual" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
            stroke="${style.stroke}" stroke-width="2" opacity="1" ${dashAttr}/>
      <polygon class="edge-visual" points="${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}" fill="${style.stroke}" opacity="1"/>
      <!-- Connection point handles (for future movability) -->
      <circle class="connection-point from-point" cx="${x1}" cy="${y1}" r="4" fill="rgba(0,100,200,0)" 
              data-edge-index="${index}" data-point="from" stroke="none"/>
      <circle class="connection-point to-point" cx="${x2}" cy="${y2}" r="4" fill="rgba(0,100,200,0)" 
              data-edge-index="${index}" data-point="to" stroke="none"/>
      ${edge.label ? `<text x="${(x1+x2)/2}" y="${(y1+y2)/2-5}" text-anchor="middle" 
                            font-size="10" fill="#666" data-edge-label="true">${edge.label}</text>` : ''}
    </g>`;
  };

  const gridPattern = `<pattern id="grid" width="${GRID_SIZE}" height="${GRID_SIZE}" patternUnits="userSpaceOnUse">
    <path d="M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
  </pattern>`;

  return `<svg width="${maxX}" height="${maxY}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gridPattern}
    <style>
      .node { cursor: move; }
      .node:hover rect { stroke-width: 4; }
      .node.dragging { opacity: 0.7; }
      .edge { cursor: pointer; }
      .edge line { opacity: 1 !important; }
      .edge polygon { opacity: 1 !important; }
      .edge-visual { opacity: 1 !important; }
      .edge:hover .edge-visual { opacity: 0.8; }
      .edge.selected .edge-visual { stroke-width: 3; stroke: #0066cc; opacity: 1; }
      .edge.selected .connection-point { fill: rgba(0,100,200,0.7); stroke: #0066cc; stroke-width: 1; cursor: move; }
      .connection-point { pointer-events: none; }
      .edge text { pointer-events: none; }
      .node text { user-select: none; pointer-events: none; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  ${canvas.nodes.map(renderNode).join('')}
  ${canvas.edges.map((edge, index) => renderEdge(edge, index)).join('')}
</svg>`;
}

async function startServer(options: ServerOptions): Promise<void> {
  const { port, file } = options;
  let canvasData: Canvas = { nodes: [], edges: [] };
  let lastModified = Date.now();
  
  console.log(`🚀 Canvas Editor on http://localhost:${port}`);
  console.log(`📁 Serving from: ${CANVAS_DIR}`);
  if (file) console.log(`📄 Editing: ${file}`);
  
  const handler = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    
    if (url.pathname === "/api/status") {
      return new Response(JSON.stringify({ updated: lastModified }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (url.pathname === "/api/canvas" && req.method === "GET") {
      return new Response(JSON.stringify(canvasData), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (url.pathname === "/api/canvas" && req.method === "POST") {
      try {
        const updated = await req.json() as Canvas;
        canvasData = updated;
        lastModified = Date.now();
        
        const canvasFile = file || "demo.canvas.yaml";
        const canvasPath = canvasFile.includes("/") ? canvasFile : join(CANVAS_DIR, canvasFile);
        await Deno.writeTextFile(canvasPath, yaml.stringify(canvasData));
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    if (url.pathname === "/" || url.pathname.startsWith("/canvas/")) {
      try {
        const canvasFile = file || "demo.canvas.yaml";
        const canvasPath = canvasFile.includes("/") ? canvasFile : join(CANVAS_DIR, canvasFile);
        
        if (!await exists(canvasPath)) {
          return new Response(`Canvas file not found: ${canvasPath}`, { status: 404 });
        }
        
        const content = await Deno.readTextFile(canvasPath);
        canvasData = yaml.parse(content) as Canvas;
        const svg = renderCanvasToSvg(canvasData);
        const html = await Deno.readTextFile("tools/canvas-editor.html");
        const finalHtml = html
          .replaceAll("{{CANVAS_FILE}}", canvasFile)
          .replaceAll("{{SVG_CONTENT}}", svg)
          .replaceAll("{{GRID_SIZE}}", String(GRID_SIZE));
        
        return new Response(finalHtml, {
          headers: { "Content-Type": "text/html" }
        });
      } catch (error) {
        return new Response(`Error: ${(error as Error).message}`, { status: 500 });
      }
    }

    // Log endpoint for client-side logs
    if (url.pathname === "/api/log" && req.method === "POST") {
      const logData = await req.json();
      console.log(`[CLIENT] ${logData.level}: ${logData.message}`, logData.data || '');
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response("Not found", { status: 404 });
  };
  
  Deno.serve({ port }, handler);
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    boolean: ["watch", "help"],
    string: ["file", "port"],
    alias: { h: "help", f: "file", p: "port", w: "watch" },
    default: { watch: true, port: String(DEFAULT_PORT) },
  });
  
  if (args.help) {
    console.log(`Canvas Editor - Interactive FSM-aware canvas

Usage: deno run -A tools/canvas-server-v2.ts [OPTIONS]

Options:
  --file, -f <path>    Canvas file (default: demo.canvas.yaml)
  --port, -p <port>    Port (default: ${DEFAULT_PORT})
  --watch, -w          Auto-reload (default: true)
  --help, -h           Show help
`);
    Deno.exit(0);
  }
  
  await startServer({
    port: parseInt(args.port as string, 10),
    file: args.file as string | undefined,
    watch: args.watch as boolean,
  });
}
