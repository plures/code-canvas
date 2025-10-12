#!/usr/bin/env -S deno run -A
/**
 * Canvas Server - Live preview and editing for canvas files
 * 
 * Provides a web-based interface for:
 * - Live canvas preview with auto-reload
 * - Interactive node manipulation
 * - YAML editor with syntax highlighting
 * - Real-time validation
 */

import { parseArgs } from "jsr:@std/cli/parse-args";
import { join } from "jsr:@std/path/join";
import { exists } from "jsr:@std/fs/exists";
import * as yaml from "jsr:@std/yaml";

const DEFAULT_PORT = 8080;
const CANVAS_DIR = "sot/canvas";

// Import canvas renderer types
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

interface ServerOptions {
  port: number;
  file?: string;
  watch: boolean;
}

// Node and edge rendering
const NODE_STYLES = {
  box: { fill: "#e1f5fe", stroke: "#01579b", strokeWidth: 2 },
  fsm: { fill: "#f3e5f5", stroke: "#4a148c", strokeWidth: 3 },
  control: { fill: "#e8f5e8", stroke: "#1b5e20", strokeWidth: 2 },
  doc: { fill: "#fff3e0", stroke: "#e65100", strokeWidth: 2 },
  database: { fill: "#fce4ec", stroke: "#880e4f", strokeWidth: 2 }
};

const EDGE_STYLES = {
  triggers: { stroke: "#d32f2f", strokeDasharray: "5,5" },
  guards: { stroke: "#1976d2", strokeDasharray: "10,2" },
  tests: { stroke: "#388e3c", strokeDasharray: "3,3" },
  implements: { stroke: "#f57c00", strokeDasharray: "none" },
  docs: { stroke: "#7b1fa2", strokeDasharray: "8,4" }
};

function renderCanvasToSvg(canvas: Canvas): string {
  // Calculate bounds
  let maxX = 800;
  let maxY = 600;
  
  if (canvas.nodes.length > 0) {
    maxX = 0;
    maxY = 0;
    for (const node of canvas.nodes) {
      maxX = Math.max(maxX, node.x + node.w);
      maxY = Math.max(maxY, node.y + node.h);
    }
    maxX += 40;
    maxY += 40;
  }

  // Render nodes
  const renderNode = (node: CanvasNode): string => {
    const style = NODE_STYLES[node.type] || NODE_STYLES.box;
    const label = node.label || node.id;
    
    return `
    <g class="node node-${node.type}" id="node-${node.id}">
      <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}"
            fill="${style.fill}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" rx="5"/>
      <text x="${node.x + node.w/2}" y="${node.y + node.h/2}" 
            text-anchor="middle" dominant-baseline="middle"
            font-family="Arial, sans-serif" font-size="14" font-weight="600">${label}</text>
    </g>`;
  };

  // Render edges
  const renderEdge = (edge: CanvasEdge): string => {
    const fromNode = canvas.nodes.find(n => n.id === edge.from);
    const toNode = canvas.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return '';

    const x1 = fromNode.x + fromNode.w / 2;
    const y1 = fromNode.y + fromNode.h / 2;
    const x2 = toNode.x + toNode.w / 2;
    const y2 = toNode.y + toNode.h / 2;

    const style = EDGE_STYLES[edge.kind || 'implements'];
    const strokeDashArray = style.strokeDasharray !== 'none' ? `stroke-dasharray="${style.strokeDasharray}"` : '';
    
    // Arrow calculation
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 10;
    const arrowX1 = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
    const arrowY1 = y2 - arrowSize * Math.sin(angle - Math.PI / 6);
    const arrowX2 = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
    const arrowY2 = y2 - arrowSize * Math.sin(angle + Math.PI / 6);

    const labelX = (x1 + x2) / 2;
    const labelY = (y1 + y2) / 2 - 5;

    return `
    <g class="edge edge-${edge.kind || 'default'}" id="edge-${edge.from}-${edge.to}">
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
            stroke="${style.stroke}" stroke-width="2" ${strokeDashArray}/>
      <polygon points="${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}" 
               fill="${style.stroke}"/>
      ${edge.label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" 
                            font-family="Arial, sans-serif" font-size="10" fill="#666">${edge.label}</text>` : ''}
    </g>`;
  };

  const nodes = canvas.nodes.map(renderNode).join('');
  const edges = canvas.edges.map(renderEdge).join('');

  return `<svg width="${maxX}" height="${maxY}" 
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
</svg>`;
}

// Enhanced HTML viewer with interactive features
function generateViewerHtml(canvasFile: string, svgContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas Server - ${canvasFile}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: #1e1e1e;
            color: #d4d4d4;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 15px 20px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 600;
        }
        
        .header .file-name {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .main-content {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .canvas-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #252526;
            border-right: 1px solid #3e3e42;
        }
        
        .toolbar {
            padding: 10px;
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .btn {
            padding: 6px 12px;
            border: 1px solid #464647;
            background: #3e3e42;
            color: #d4d4d4;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .btn:hover {
            background: #505052;
            border-color: #565658;
        }
        
        .btn.primary {
            background: #0e639c;
            border-color: #0e639c;
        }
        
        .btn.primary:hover {
            background: #1177bb;
        }
        
        .canvas-viewer {
            flex: 1;
            overflow: auto;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #canvas-svg {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: transform 0.2s;
        }
        
        .info-panel {
            width: 300px;
            background: #252526;
            padding: 15px;
            overflow-y: auto;
            border-left: 1px solid #3e3e42;
        }
        
        .info-section {
            margin-bottom: 20px;
        }
        
        .info-section h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #569cd6;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .node-item {
            padding: 8px;
            margin: 5px 0;
            background: #2d2d30;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .node-item:hover {
            background: #37373d;
            border-color: #569cd6;
        }
        
        .node-item.selected {
            border-color: #569cd6;
            background: #37373d;
        }
        
        .node-type {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            margin-right: 5px;
        }
        
        .type-box { background: #e1f5fe; color: #01579b; }
        .type-fsm { background: #f3e5f5; color: #4a148c; }
        .type-control { background: #e8f5e8; color: #1b5e20; }
        .type-doc { background: #fff3e0; color: #e65100; }
        .type-database { background: #fce4ec; color: #880e4f; }
        
        .search-box {
            width: 100%;
            padding: 8px;
            background: #3c3c3c;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            color: #d4d4d4;
            font-size: 12px;
        }
        
        .search-box:focus {
            outline: none;
            border-color: #569cd6;
        }
        
        .status-bar {
            padding: 8px 15px;
            background: #007acc;
            color: white;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
        }
        
        .live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .live-dot {
            width: 8px;
            height: 8px;
            background: #4caf50;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .node-tooltip {
            position: absolute;
            background: #1e1e1e;
            border: 1px solid #569cd6;
            border-radius: 4px;
            padding: 10px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            display: none;
            max-width: 300px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>🎨 Canvas Server</h1>
            <div class="file-name">${canvasFile}</div>
        </div>
        <div class="live-indicator">
            <span class="live-dot"></span>
            <span>Live Preview</span>
        </div>
    </div>
    
    <div class="main-content">
        <div class="canvas-panel">
            <div class="toolbar">
                <button class="btn" onclick="zoomIn()">🔍 Zoom In</button>
                <button class="btn" onclick="zoomOut()">🔍 Zoom Out</button>
                <button class="btn" onclick="resetView()">↻ Reset</button>
                <button class="btn" onclick="fitToScreen()">⛶ Fit</button>
                <button class="btn primary" onclick="downloadSvg()">💾 Download</button>
            </div>
            
            <div class="canvas-viewer" id="canvas-viewer">
                <div id="canvas-svg">${svgContent}</div>
            </div>
        </div>
        
        <div class="info-panel">
            <div class="info-section">
                <h3>Search</h3>
                <input type="text" class="search-box" id="search-box" 
                       placeholder="Search nodes...">
            </div>
            
            <div class="info-section">
                <h3>Nodes</h3>
                <div id="node-list"></div>
            </div>
            
            <div class="info-section">
                <h3>Selection</h3>
                <div id="selection-info">Click a node to see details</div>
            </div>
        </div>
    </div>
    
    <div class="status-bar">
        <span id="status-text">Ready</span>
        <span id="node-count">0 nodes</span>
    </div>
    
    <div class="node-tooltip" id="tooltip"></div>
    
    <script>
        let currentZoom = 1;
        let selectedNode = null;
        const svg = document.querySelector('svg');
        const nodes = [];
        
        // Initialize
        function init() {
            // Parse nodes from SVG
            document.querySelectorAll('.node').forEach(nodeEl => {
                const id = nodeEl.id.replace('node-', '');
                const type = nodeEl.classList[1] || 'box';
                const label = nodeEl.querySelector('text')?.textContent || id;
                
                nodes.push({ id, type, label, element: nodeEl });
                
                // Add click handler
                nodeEl.style.cursor = 'pointer';
                nodeEl.addEventListener('click', () => selectNode(id));
                
                // Add hover tooltip
                nodeEl.addEventListener('mouseenter', (e) => showTooltip(id, e));
                nodeEl.addEventListener('mouseleave', hideTooltip);
            });
            
            renderNodeList();
            updateStatus();
        }
        
        function renderNodeList() {
            const list = document.getElementById('node-list');
            list.innerHTML = nodes.map(node => \`
                <div class="node-item" data-node="\${node.id}" 
                     onclick="selectNode('\${node.id}')">
                    <span class="node-type type-\${node.type}">\${node.type}</span>
                    <span>\${node.label}</span>
                </div>
            \`).join('');
        }
        
        function selectNode(nodeId) {
            selectedNode = nodeId;
            
            // Update visual selection
            nodes.forEach(node => {
                node.element.style.opacity = node.id === nodeId ? '1' : '0.4';
            });
            
            // Update list selection
            document.querySelectorAll('.node-item').forEach(item => {
                item.classList.toggle('selected', item.dataset.node === nodeId);
            });
            
            // Show node details
            const node = nodes.find(n => n.id === nodeId);
            document.getElementById('selection-info').innerHTML = \`
                <strong>\${node.label}</strong><br>
                <small>ID: \${node.id}</small><br>
                <small>Type: \${node.type}</small>
            \`;
        }
        
        function showTooltip(nodeId, e) {
            const node = nodes.find(n => n.id === nodeId);
            const tooltip = document.getElementById('tooltip');
            tooltip.innerHTML = \`
                <strong>\${node.label}</strong><br>
                <small>Type: \${node.type}</small><br>
                <small>ID: \${node.id}</small>
            \`;
            tooltip.style.display = 'block';
            tooltip.style.left = e.pageX + 10 + 'px';
            tooltip.style.top = e.pageY + 10 + 'px';
        }
        
        function hideTooltip() {
            document.getElementById('tooltip').style.display = 'none';
        }
        
        function updateStatus() {
            document.getElementById('node-count').textContent = 
                \`\${nodes.length} nodes\`;
        }
        
        // Zoom controls
        function zoomIn() {
            currentZoom *= 1.2;
            updateZoom();
        }
        
        function zoomOut() {
            currentZoom /= 1.2;
            updateZoom();
        }
        
        function resetView() {
            currentZoom = 1;
            updateZoom();
            // Clear selection
            nodes.forEach(node => node.element.style.opacity = '1');
            selectedNode = null;
        }
        
        function fitToScreen() {
            const viewer = document.getElementById('canvas-viewer');
            const svgContainer = document.getElementById('canvas-svg');
            
            const viewerWidth = viewer.clientWidth - 40;
            const viewerHeight = viewer.clientHeight - 40;
            const svgWidth = svg.viewBox.baseVal.width;
            const svgHeight = svg.viewBox.baseVal.height;
            
            const scaleX = viewerWidth / svgWidth;
            const scaleY = viewerHeight / svgHeight;
            currentZoom = Math.min(scaleX, scaleY, 1);
            updateZoom();
        }
        
        function updateZoom() {
            const container = document.getElementById('canvas-svg');
            container.style.transform = \`scale(\${currentZoom})\`;
        }
        
        function downloadSvg() {
            const svgData = svg.outerHTML;
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '${canvasFile}.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        // Search functionality
        document.getElementById('search-box').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            nodes.forEach(node => {
                const matches = !query || 
                    node.id.toLowerCase().includes(query) ||
                    node.label.toLowerCase().includes(query);
                
                node.element.style.opacity = matches ? '1' : '0.2';
                
                const item = document.querySelector(\`[data-node="\${node.id}"]\`);
                if (item) {
                    item.style.display = matches ? 'block' : 'none';
                }
            });
        });
        
        // Auto-reload via polling
        let lastUpdate = Date.now();
        setInterval(async () => {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                if (data.updated > lastUpdate) {
                    location.reload();
                }
            } catch (e) {
                // Server might be restarting
            }
        }, 2000);
        
        // Initialize on load
        init();
        setTimeout(fitToScreen, 100);
    </script>
</body>
</html>`;
}

// Simple HTTP server
async function startServer(options: ServerOptions): Promise<void> {
  const { port, file, watch } = options;
  
  console.log(`🚀 Starting Canvas Server on http://localhost:${port}`);
  console.log(`📁 Serving from: ${CANVAS_DIR}`);
  
  if (file) {
    console.log(`📄 Watching: ${file}`);
  }
  
  const handler = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    
    // API endpoint for status
    if (url.pathname === "/api/status") {
      return new Response(JSON.stringify({
        updated: Date.now(),
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Serve canvas viewer
    if (url.pathname === "/" || url.pathname.startsWith("/canvas/")) {
      try {
        const canvasFile = file || "demo.canvas.yaml";
        // Handle both full paths and just filenames
        const canvasPath = canvasFile.includes("/") ? canvasFile : join(CANVAS_DIR, canvasFile);
        
        if (!await exists(canvasPath)) {
          return new Response(`Canvas file not found: ${canvasPath}`, { status: 404 });
        }
        
        // Read and render canvas
        const content = await Deno.readTextFile(canvasPath);
        const canvas = yaml.parse(content) as Canvas;
        
        // Generate SVG from canvas
        const svg = renderCanvasToSvg(canvas);
        
        const html = generateViewerHtml(canvasFile, svg);
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      } catch (error) {
        const err = error as Error;
        return new Response(`Error: ${err.message}`, { status: 500 });
      }
    }
    
    return new Response("Not found", { status: 404 });
  };
  
  Deno.serve({ port }, handler);
}

// CLI interface
if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    boolean: ["watch", "help"],
    string: ["file", "port"],
    alias: { h: "help", f: "file", p: "port", w: "watch" },
    default: { watch: true, port: String(DEFAULT_PORT) },
  });
  
  if (args.help) {
    console.log(`
Canvas Server - Live preview and editing

Usage:
  deno run -A tools/canvas-server.ts [OPTIONS]

Options:
  --file, -f <path>    Canvas file to serve (default: demo.canvas.yaml)
  --port, -p <port>    Port to listen on (default: ${DEFAULT_PORT})
  --watch, -w          Enable auto-reload (default: true)
  --help, -h           Show this help

Examples:
  deno run -A tools/canvas-server.ts
  deno run -A tools/canvas-server.ts -f auth-example.canvas.yaml
  deno run -A tools/canvas-server.ts -p 3000
`);
    Deno.exit(0);
  }
  
  await startServer({
    port: parseInt(args.port as string, 10),
    file: args.file as string | undefined,
    watch: args.watch as boolean,
  });
}
