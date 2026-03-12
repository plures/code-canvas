#!/usr/bin/env -S deno run -A
/**
 * Self-Managing Canvas Server - Interactive editor with drill-down and self-modification
 * Allows teams to visually manage application architecture and drill into components
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
  group: { fill: "#f5f5f5", stroke: "#757575", strokeWidth: 1 },
};

const EDGE_STYLES = {
  triggers: { stroke: "#d32f2f", dash: "5,5" },
  guards: { stroke: "#1976d2", dash: "10,2" },
  tests: { stroke: "#388e3c", dash: "3,3" },
  implements: { stroke: "#f57c00", dash: "none" },
  docs: { stroke: "#7b1fa2", dash: "8,4" },
};

function renderCanvasToSvg(canvas: Canvas): string {
  let maxX = 800, maxY = 600;
  if (canvas.nodes.length > 0) {
    maxX = Math.max(...canvas.nodes.map((n) => n.x + (n.w || n.width || 120))) + 40;
    maxY = Math.max(...canvas.nodes.map((n) => n.y + (n.h || n.height || 60))) + 40;
  }

  const renderNode = (node: CanvasNode) => {
    const style = NODE_STYLES[node.type] || NODE_STYLES.box;
    const label = node.label || node.text || node.id;
    const width = node.w || node.width || 120;
    const height = node.h || node.height || 60;
    const fill = node.color || style.fill;

    // Add drill-down indicator if node has ref
    const drillDownIcon = node.ref
      ? `<circle cx="${node.x + width - 15}" cy="${node.y + 15}" r="8" 
               fill="#2196f3" stroke="white" stroke-width="2" class="drill-down-icon" 
               title="Click to drill down into ${node.ref}"/>
       <text x="${node.x + width - 15}" y="${node.y + 20}" 
             text-anchor="middle" font-family="Arial" font-size="10" 
             font-weight="bold" fill="white" class="drill-down-text">↓</text>`
      : "";

    return `<g class="node node-${node.type}" id="node-${node.id}" 
               data-x="${node.x}" data-y="${node.y}" data-w="${width}" data-h="${height}"
               data-ref="${node.ref || ""}" data-drill-down="${node.props?.drillDown || ""}">
      <rect x="${node.x}" y="${node.y}" width="${width}" height="${height}"
            fill="${fill}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" rx="5"/>
      <text x="${node.x + width / 2}" y="${node.y + height / 2}" 
            text-anchor="middle" dominant-baseline="middle"
            font-family="Arial" font-size="14" font-weight="600">${label}</text>
      ${drillDownIcon}
    </g>`;
  };

  const renderEdge = (edge: CanvasEdge, index: number) => {
    const fromId = edge.from || edge.fromNode;
    const toId = edge.to || edge.toNode;
    const from = canvas.nodes.find((n) => n.id === fromId);
    const to = canvas.nodes.find((n) => n.id === toId);
    if (!from || !to) return "";

    const fromWidth = from.w || from.width || 120;
    const fromHeight = from.h || from.height || 60;
    const toWidth = to.w || to.width || 120;
    const toHeight = to.h || to.height || 60;

    const x1 = from.x + fromWidth / 2, y1 = from.y + fromHeight / 2;
    const x2 = to.x + toWidth / 2, y2 = to.y + toHeight / 2;
    const style = EDGE_STYLES[edge.kind || "implements"];
    const dashAttr = style.dash !== "none" ? `stroke-dasharray="${style.dash}"` : "";

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 10;
    const ax1 = x2 - size * Math.cos(angle - Math.PI / 6);
    const ay1 = y2 - size * Math.sin(angle - Math.PI / 6);
    const ax2 = x2 - size * Math.cos(angle + Math.PI / 6);
    const ay2 = y2 - size * Math.sin(angle + Math.PI / 6);

    return `<g class="edge edge-${edge.kind || "default"}" id="edge-${index}">
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="edge-visual"
            stroke="${style.stroke}" stroke-width="2" ${dashAttr}/>
      <polygon points="${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}" fill="${style.stroke}"/>
      ${
      edge.label
        ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}" text-anchor="middle" 
                             font-family="Arial" font-size="12" fill="${style.stroke}">${edge.label}</text>`
        : ""
    }
    </g>`;
  };

  const gridPattern =
    `<pattern id="grid" width="${GRID_SIZE}" height="${GRID_SIZE}" patternUnits="userSpaceOnUse">
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
      .drill-down-icon { cursor: pointer; }
      .drill-down-icon:hover { fill: #1976d2; }
      
      /* Enhanced interactivity styling */
      .node { cursor: grab; }
      .node:hover { filter: drop-shadow(0 0 8px rgba(0, 122, 204, 0.5)); }
      .node.dragging { cursor: grabbing; filter: drop-shadow(0 0 12px rgba(0, 122, 204, 0.8)); }
      .node.selected { filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.8)); }
      
      .edge { cursor: pointer; transition: opacity 0.2s; }
      .edge:hover { opacity: 0.8 !important; }
      .edge.selected { stroke: #ffc107 !important; stroke-width: 3 !important; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  ${canvas.nodes.map(renderNode).join("")}
  ${canvas.edges.map((edge, index) => renderEdge(edge, index)).join("")}
</svg>`;
}

// Enhanced HTML editor with drill-down capabilities
function generateEditorHtml(canvasFile: string, svgContent: string): string {
  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Self-Managing Canvas - ${canvasFile}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a; color: #ffffff; overflow: hidden; height: 100vh;
        }
        .header {
            background: #2d2d2d; padding: 12px 16px; display: flex; align-items: center;
            justify-content: space-between; border-bottom: 1px solid #404040;
        }
        .title { font-size: 16px; font-weight: 600; }
        .breadcrumb { font-size: 14px; color: #888; }
        .toolbar {
            background: #333; padding: 8px 16px; display: flex; align-items: center;
            gap: 12px; border-bottom: 1px solid #404040;
        }
        .btn {
            background: #0066cc; color: white; border: none; padding: 8px 12px;
            border-radius: 4px; cursor: pointer; font-size: 14px;
        }
        .btn:hover { background: #0052a3; }
        .btn.secondary { background: #666; }
        .btn.secondary:hover { background: #777; }
        .main-container { 
            display: flex; height: calc(100vh - 120px);
        }
        .canvas-container { 
            flex: 1; background: #2a2a2a; position: relative; overflow: auto;
            display: flex; align-items: center; justify-content: center;
        }
        .sidebar {
            width: 300px; background: #1e1e1e; border-left: 1px solid #404040;
            display: flex; flex-direction: column;
        }
        .sidebar-section {
            border-bottom: 1px solid #404040; padding: 16px;
        }
        .sidebar-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
        .status-bar {
            background: #2d2d2d; padding: 8px 16px; font-size: 12px;
            color: #888; border-top: 1px solid #404040;
        }
        svg { border: 1px solid #404040; }
        #canvas-svg { max-width: 100%; max-height: 100%; }
        .drill-down-panel {
            position: absolute; top: 60px; left: 20px; background: #2d2d2d;
            border: 1px solid #404040; border-radius: 8px; padding: 16px;
            min-width: 250px; display: none;
        }
        .drill-down-title { font-weight: 600; margin-bottom: 8px; }
        .drill-down-options { display: flex; flex-direction: column; gap: 8px; }
        .file-viewer {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); z-index: 1000; display: none;
            align-items: center; justify-content: center;
        }
        .file-viewer-content {
            background: #1e1e1e; border: 1px solid #404040; border-radius: 8px;
            max-width: 80vw; max-height: 80vh; overflow: auto; position: relative;
        }
        .file-viewer-header {
            background: #2d2d2d; padding: 12px 16px; border-bottom: 1px solid #404040;
            display: flex; justify-content: between; align-items: center;
        }
        .file-viewer-close {
            background: #666; color: white; border: none; padding: 4px 8px;
            border-radius: 4px; cursor: pointer; margin-left: auto;
        }
        .file-content {
            padding: 16px; font-family: 'Courier New', monospace; font-size: 14px;
            white-space: pre-wrap; max-height: 60vh; overflow: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="title">Self-Managing Canvas Editor</div>
            <div class="breadcrumb" id="breadcrumb">${canvasFile}</div>
        </div>
        <div style="display: flex; gap: 8px;">
            <button class="btn secondary" onclick="goBack()" id="back-btn" style="display: none;">← Back</button>
            <button class="btn" onclick="saveCanvas()">Save</button>
        </div>
    </div>
    
    <div class="toolbar">
        <button class="btn secondary" onclick="addNode()">+ Node</button>
        <button class="btn secondary" onclick="addEdge()">+ Edge</button>
        <button class="btn secondary" onclick="deleteSelected()">Delete</button>
        <div style="margin-left: auto; display: flex; gap: 8px;">
            <button class="btn secondary" onclick="zoomOut()">−</button>
            <button class="btn secondary" onclick="zoomIn()">+</button>
            <button class="btn secondary" onclick="fitToScreen()">Fit</button>
        </div>
    </div>
    
    <div class="main-container">
        <div class="canvas-container">
            <div id="canvas-svg">${svgContent}</div>
            <div class="drill-down-panel" id="drill-down-panel">
                <div class="drill-down-title" id="drill-down-title">Component: </div>
                <div class="drill-down-options" id="drill-down-options"></div>
            </div>
        </div>
        
        <div class="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">Navigation Stack</div>
                <div id="nav-stack"></div>
            </div>
            <div class="sidebar-section">
                <div class="sidebar-title">Selection</div>
                <div id="selection-info">No selection</div>
            </div>
        </div>
    </div>
    
    <div class="status-bar">
        <span id="status">Ready • Self-managing canvas system</span>
    </div>

    <div class="file-viewer" id="file-viewer">
        <div class="file-viewer-content">
            <div class="file-viewer-header">
                <span id="file-viewer-title">File Viewer</span>
                <button class="file-viewer-close" onclick="closeFileViewer()">×</button>
            </div>
            <div class="file-content" id="file-content"></div>
        </div>
    </div>
    
    <script>
// Enhanced Canvas Editor with Self-Management and Drill-Down
let canvas = { nodes: [], edges: [] };
let navigationStack = [];
let currentCanvas = "${canvasFile}";
let selectedNode = null;
let isDragging = false;
let dragNode = null;
let dragOffset = { x: 0, y: 0 };
let currentZoom = 1;

// Navigation and drill-down functionality
function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    const backBtn = document.getElementById('back-btn');
    
    if (navigationStack.length === 0) {
        breadcrumb.textContent = currentCanvas;
        backBtn.style.display = 'none';
    } else {
        const path = [...navigationStack, currentCanvas].join(' → ');
        breadcrumb.textContent = path;
        backBtn.style.display = 'block';
    }
    
    updateNavigationStack();
}

function updateNavigationStack() {
    const navStack = document.getElementById('nav-stack');
    navStack.innerHTML = '';
    
    [...navigationStack, currentCanvas].forEach((item, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 4px 8px; margin: 2px 0; background: #333; border-radius: 4px; cursor: pointer;';
        div.textContent = item;
        
        if (index < navigationStack.length) {
            div.onclick = () => navigateToLevel(index);
        } else {
            div.style.background = '#0066cc';
            div.style.cursor = 'default';
        }
        
        navStack.appendChild(div);
    });
}

function navigateToLevel(level) {
    // Navigate back to a specific level in the stack
    const targetCanvas = [...navigationStack, currentCanvas][level];
    navigationStack = navigationStack.slice(0, level);
    loadCanvas(targetCanvas);
}

function goBack() {
    if (navigationStack.length > 0) {
        const previousCanvas = navigationStack.pop();
        loadCanvas(previousCanvas);
    }
}

function drillDown(nodeId) {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node || !node.ref) return;
    
    const drillDownType = node.props?.drillDown || 'file';
    
    if (drillDownType === 'canvas') {
        // Navigate to another canvas
        navigationStack.push(currentCanvas);
        loadCanvas(node.ref);
    } else if (drillDownType === 'file') {
        // Show file viewer
        showFileViewer(node.ref);
    }
}

async function showFileViewer(filePath) {
    try {
        const response = await fetch(\`/api/file?path=\${encodeURIComponent(filePath)}\`);
        const content = await response.text();
        
        document.getElementById('file-viewer-title').textContent = filePath;
        document.getElementById('file-content').textContent = content;
        document.getElementById('file-viewer').style.display = 'flex';
    } catch (error) {
        showStatus('Error loading file: ' + error.message, 'error');
    }
}

function closeFileViewer() {
    document.getElementById('file-viewer').style.display = 'none';
}

// Enhanced node interaction
function showDrillDownPanel(nodeId, x, y) {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node || !node.ref) return;
    
    const panel = document.getElementById('drill-down-panel');
    const title = document.getElementById('drill-down-title');
    const options = document.getElementById('drill-down-options');
    
    title.textContent = \`Component: \${node.label || node.id}\`;
    options.innerHTML = '';
    
    const drillDownType = node.props?.drillDown || 'file';
    const description = node.props?.description || 'No description';
    
    // Add description
    const descDiv = document.createElement('div');
    descDiv.style.cssText = 'font-size: 12px; color: #888; margin-bottom: 8px;';
    descDiv.textContent = description;
    options.appendChild(descDiv);
    
    // Add drill-down button
    const drillBtn = document.createElement('button');
    drillBtn.className = 'btn';
    drillBtn.textContent = drillDownType === 'canvas' ? '🎨 Open Canvas' : '📄 View File';
    drillBtn.onclick = () => {
        drillDown(nodeId);
        panel.style.display = 'none';
    };
    options.appendChild(drillBtn);
    
    // Add edit button for files
    if (drillDownType === 'file') {
        const editBtn = document.createElement('button');
        editBtn.className = 'btn secondary';
        editBtn.textContent = '✏️ Edit in VS Code';
        editBtn.onclick = () => {
            editFile(node.ref);
            panel.style.display = 'none';
        };
        options.appendChild(editBtn);
    }
    
    // Position and show panel
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    panel.style.display = 'block';
    
    // Hide panel on click outside
    setTimeout(() => {
        document.addEventListener('click', function hidePanel(e) {
            if (!panel.contains(e.target)) {
                panel.style.display = 'none';
                document.removeEventListener('click', hidePanel);
            }
        });
    }, 100);
}

async function editFile(filePath) {
    try {
        await fetch('/api/edit-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath })
        });
        showStatus('Opened file in VS Code: ' + filePath);
    } catch (error) {
        showStatus('Error opening file: ' + error.message, 'error');
    }
}

// Enhanced canvas loading
async function loadCanvas(canvasFile = currentCanvas) {
    try {
        currentCanvas = canvasFile || currentCanvas;
        const response = await fetch('/api/canvas?file=' + encodeURIComponent(currentCanvas));
        canvas = await response.json();
        
        // Re-render canvas
        const svgResponse = await fetch('/api/render?file=' + encodeURIComponent(currentCanvas));
        const svgContent = await svgResponse.text();
        document.getElementById('canvas-svg').innerHTML = svgContent;
        
        console.log('Canvas HTML updated, re-initializing interactions...');
        // Re-initialize interactions after DOM update
        setTimeout(() => {
            initDragDrop();
            console.log('Interactions re-initialized after canvas reload');
        }, 100);
        updateBreadcrumb();
        showStatus('Loaded canvas: ' + currentCanvas);
    } catch (error) {
        showStatus('Error loading canvas: ' + error.message, 'error');
    }
}

// Enhanced drag and drop with drill-down handling
function initDragDrop() {
    console.log('Initializing drag and drop...');
    const svg = document.querySelector('svg');
    if (!svg) {
        console.error('SVG not found!');
        return;
    }
    console.log('SVG found:', svg);
    
    // Click handling for nodes and edges
    svg.addEventListener('click', (e) => {
        console.log('SVG clicked!', e.target);
        e.preventDefault();
        
        // Check if clicked on drill-down icon
        if (e.target.classList.contains('drill-down-icon') || e.target.classList.contains('drill-down-text')) {
            const nodeEl = e.target.closest('.node');
            if (nodeEl) {
                const nodeId = nodeEl.id.replace('node-', '');
                const rect = nodeEl.getBoundingClientRect();
                showDrillDownPanel(nodeId, rect.right - 200, rect.top);
            }
            return;
        }
        
        // Check if clicked on edge
        const edgeEl = e.target.closest('.edge');
        if (edgeEl) {
            const edgeId = edgeEl.id;
            selectEdge(edgeId);
            return;
        }
        
        // Check if clicked on node
        const nodeEl = e.target.closest('.node');
        if (nodeEl) {
            const nodeId = nodeEl.id.replace('node-', '');
            selectNode(nodeId);
            return;
        }
        
        // Clicked on empty space - clear selection
        clearSelection();
    });
    
    // Double-click to drill down
    svg.addEventListener('dblclick', (e) => {
        const nodeEl = e.target.closest('.node');
        if (nodeEl) {
            const nodeId = nodeEl.id.replace('node-', '');
            drillDown(nodeId);
        }
    });
    
    // Mouse down for dragging
    svg.addEventListener('mousedown', (e) => {
        const nodeEl = e.target.closest('.node');
        if (nodeEl && !e.target.classList.contains('drill-down-icon') && !e.target.classList.contains('drill-down-text')) {
            const nodeId = nodeEl.id.replace('node-', '');
            const node = canvas.nodes.find(n => n.id === nodeId);
            if (!node) return;
            
            isDragging = true;
            dragNode = node;
            
            const svgRect = svg.getBoundingClientRect();
            const mouseX = (e.clientX - svgRect.left) / currentZoom;
            const mouseY = (e.clientY - svgRect.top) / currentZoom;
            
            dragOffset.x = mouseX - node.x;
            dragOffset.y = mouseY - node.y;
            
            nodeEl.classList.add('dragging');
            svg.style.cursor = 'grabbing';
            
            e.preventDefault();
        }
    });
    
    // Mouse move for dragging
    svg.addEventListener('mousemove', (e) => {
        if (!isDragging || !dragNode) return;
        
        const svgRect = svg.getBoundingClientRect();
        const mouseX = (e.clientX - svgRect.left) / currentZoom;
        const mouseY = (e.clientY - svgRect.top) / currentZoom;
        
        const newX = Math.round((mouseX - dragOffset.x) / 20) * 20; // Snap to grid
        const newY = Math.round((mouseY - dragOffset.y) / 20) * 20;
        
        dragNode.x = Math.max(0, newX);
        dragNode.y = Math.max(0, newY);
        
        updateNodePosition(dragNode);
        updateEdges();
        
        e.preventDefault();
    });
    
    // Mouse up to stop dragging
    svg.addEventListener('mouseup', (e) => {
        if (isDragging && dragNode) {
            const nodeEl = document.getElementById('node-' + dragNode.id);
            if (nodeEl) {
                nodeEl.classList.remove('dragging');
            }
            
            showStatus('Node moved • Press Save to persist changes');
            
            isDragging = false;
            dragNode = null;
            svg.style.cursor = 'default';
        }
    });
    
    // Mouse leave to stop dragging
    svg.addEventListener('mouseleave', () => {
        if (isDragging && dragNode) {
            const nodeEl = document.getElementById('node-' + dragNode.id);
            if (nodeEl) {
                nodeEl.classList.remove('dragging');
            }
            
            isDragging = false;
            dragNode = null;
            svg.style.cursor = 'default';
        }
    });
    
    // Edge hover effects - add to all edges
    const edges = svg.querySelectorAll('.edge');
    console.log('Adding hover effects to', edges.length, 'edges');
    edges.forEach(edge => {
        edge.addEventListener('mouseenter', () => {
            console.log('Edge mouseenter');
            edge.style.opacity = '0.8';
        });
        
        edge.addEventListener('mouseleave', () => {
            console.log('Edge mouseleave');
            if (!edge.classList.contains('selected')) {
                edge.style.opacity = '1';
            }
        });
    });
    
    // Add mouseover/mouseout to entire SVG for general debugging
    svg.addEventListener('mouseover', (e) => {
        if (e.target.tagName === 'path' || e.target.closest('.edge')) {
            console.log('Mouse over edge element');
        }
    });
}

// Node selection functionality
function selectNode(nodeId) {
    // Clear previous selections
    clearSelection();
    
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    selectedNode = nodeId;
    
    // Visual selection
    const nodeEl = document.getElementById('node-' + nodeId);
    if (nodeEl) {
        const rect = nodeEl.querySelector('rect');
        if (rect) {
            rect.style.strokeWidth = '4';
            rect.style.stroke = '#0066cc';
        }
    }
    
    // Update selection info in sidebar
    const selectionInfo = document.getElementById('selection-info');
    const width = node.w || node.width || 120;
    const height = node.h || node.height || 60;
    
    selectionInfo.innerHTML = \`
        <div style="margin-bottom: 8px; font-weight: 600;">Node: \${node.label || node.id}</div>
        <div style="font-size: 12px; color: #888; margin-bottom: 8px;">Type: \${node.type}</div>
        <div style="font-size: 12px; color: #888; margin-bottom: 8px;">Position: \${node.x}, \${node.y}</div>
        <div style="font-size: 12px; color: #888; margin-bottom: 8px;">Size: \${width} × \${height}</div>
        \${node.ref ? \`<div style="font-size: 12px; color: #888;">Ref: \${node.ref}</div>\` : ''}
    \`;
    
    showStatus('Selected node: ' + (node.label || node.id));
}

// Edge selection functionality
function selectEdge(edgeId) {
    // Clear previous selections
    clearSelection();
    
    const edgeEl = document.getElementById(edgeId);
    if (!edgeEl) return;
    
    // Visual selection
    edgeEl.classList.add('selected');
    const lines = edgeEl.querySelectorAll('line');
    lines.forEach(line => {
        line.style.strokeWidth = '4';
        line.style.stroke = '#0066cc';
    });
    
    // Update selection info
    const selectionInfo = document.getElementById('selection-info');
    selectionInfo.innerHTML = \`
        <div style="margin-bottom: 8px; font-weight: 600;">Edge Selected</div>
        <div style="font-size: 12px; color: #888;">ID: \${edgeId}</div>
    \`;
    
    showStatus('Selected edge: ' + edgeId);
}

// Clear all selections
function clearSelection() {
    selectedNode = null;
    
    // Clear node selections
    const nodes = document.querySelectorAll('.node rect');
    nodes.forEach(rect => {
        rect.style.strokeWidth = '';
        rect.style.stroke = '';
    });
    
    // Clear edge selections
    const edges = document.querySelectorAll('.edge');
    edges.forEach(edge => {
        edge.classList.remove('selected');
        const lines = edge.querySelectorAll('line');
        lines.forEach(line => {
            line.style.strokeWidth = '';
            line.style.stroke = '';
        });
    });
    
    // Clear selection info
    const selectionInfo = document.getElementById('selection-info');
    selectionInfo.innerHTML = 'No selection';
}

// Update node position in DOM
function updateNodePosition(node) {
    const nodeEl = document.getElementById('node-' + node.id);
    if (!nodeEl) return;
    
    const rect = nodeEl.querySelector('rect');
    const text = nodeEl.querySelector('text');
    const drillIcon = nodeEl.querySelector('.drill-down-icon');
    const drillText = nodeEl.querySelector('.drill-down-text');
    
    const width = node.w || node.width || 120;
    const height = node.h || node.height || 60;
    
    if (rect) {
        rect.setAttribute('x', node.x);
        rect.setAttribute('y', node.y);
    }
    
    if (text) {
        text.setAttribute('x', node.x + width / 2);
        text.setAttribute('y', node.y + height / 2);
    }
    
    if (drillIcon) {
        drillIcon.setAttribute('cx', node.x + width - 15);
        drillIcon.setAttribute('cy', node.y + 15);
    }
    
    if (drillText) {
        drillText.setAttribute('x', node.x + width - 15);
        drillText.setAttribute('y', node.y + 20);
    }
    
    // Update data attributes
    nodeEl.setAttribute('data-x', node.x);
    nodeEl.setAttribute('data-y', node.y);
}

// Update all edges after node movement
function updateEdges() {
    canvas.edges.forEach((edge, index) => {
        const fromId = edge.from || edge.fromNode;
        const toId = edge.to || edge.toNode;
        const fromNode = canvas.nodes.find(n => n.id === fromId);
        const toNode = canvas.nodes.find(n => n.id === toId);
        
        if (!fromNode || !toNode) return;
        
        const edgeEl = document.getElementById(\`edge-\${index}\`);
        if (!edgeEl) return;
        
        const fromWidth = fromNode.w || fromNode.width || 120;
        const fromHeight = fromNode.h || fromNode.height || 60;
        const toWidth = toNode.w || toNode.width || 120;
        const toHeight = toNode.h || toNode.height || 60;
        
        const x1 = fromNode.x + fromWidth / 2;
        const y1 = fromNode.y + fromHeight / 2;
        const x2 = toNode.x + toWidth / 2;
        const y2 = toNode.y + toHeight / 2;
        
        const line = edgeEl.querySelector('line');
        if (line) {
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
        }
        
        // Update arrow
        const arrow = edgeEl.querySelector('polygon');
        if (arrow) {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const size = 10;
            const ax1 = x2 - size * Math.cos(angle - Math.PI / 6);
            const ay1 = y2 - size * Math.sin(angle - Math.PI / 6);
            const ax2 = x2 - size * Math.cos(angle + Math.PI / 6);
            const ay2 = y2 - size * Math.sin(angle + Math.PI / 6);
            
            arrow.setAttribute('points', \`\${x2},\${y2} \${ax1},\${ay1} \${ax2},\${ay2}\`);
        }
        
        // Update label position
        const text = edgeEl.querySelector('text');
        if (text) {
            text.setAttribute('x', (x1 + x2) / 2);
            text.setAttribute('y', (y1 + y2) / 2 - 5);
        }
    });
}

// Save canvas functionality
async function saveCanvas() {
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                file: currentCanvas,
                canvas: canvas 
            })
        });
        
        if (response.ok) {
            showStatus('Canvas saved successfully!');
        } else {
            showStatus('Error saving canvas', 'error');
        }
    } catch (error) {
        showStatus('Error saving canvas: ' + error.message, 'error');
    }
}

// Placeholder functions for toolbar buttons
function addNode() {
    showStatus('Add Node functionality coming soon...');
}

function addEdge() {
    showStatus('Add Edge functionality coming soon...');
}

function deleteSelected() {
    if (selectedNode) {
        showStatus('Delete Node functionality coming soon...');
    } else {
        showStatus('No node selected');
    }
}

function zoomIn() {
    currentZoom = Math.min(currentZoom * 1.2, 3);
    updateZoom();
}

function zoomOut() {
    currentZoom = Math.max(currentZoom / 1.2, 0.3);
    updateZoom();
}

function updateZoom() {
    const svg = document.querySelector('svg');
    if (svg) {
        svg.style.transform = \`scale(\${currentZoom})\`;
        svg.style.transformOrigin = '0 0';
    }
    showStatus(\`Zoom: \${Math.round(currentZoom * 100)}%\`);
}

function fitToScreen() {
    currentZoom = 1;
    updateZoom();
}

// Status and utility functions
function showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    
    if (type === 'error') {
        status.style.color = '#ff4444';
    } else {
        status.style.color = '#888';
    }
    
    setTimeout(() => {
        status.textContent = 'Ready • Self-managing canvas system';
        status.style.color = '#888';
    }, 3000);
}

// [Additional canvas management functions would go here...]

// Initialize
window.addEventListener('load', async () => {
    console.log('Initializing canvas...');
    
    // Load initial canvas data
    try {
        const response = await fetch('/api/canvas');
        canvas = await response.json();
        console.log('Canvas loaded:', canvas);
    } catch (error) {
        console.error('Error loading canvas:', error);
    }
    
    // Initialize interactions
    initDragDrop();
    updateBreadcrumb();
    
    console.log('Canvas initialization complete');
});
    </script>
</body>
</html>`;

  return template;
}

async function startServer(options: ServerOptions): Promise<void> {
  const { port, file } = options;
  let canvasData: Canvas = { nodes: [], edges: [] };

  console.log(`🎨 Self-Managing Canvas Server on http://localhost:${port}`);
  console.log(`📁 Canvas directory: ${CANVAS_DIR}`);
  if (file) console.log(`📄 Default canvas: ${file}`);

  const handler = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/") {
      const targetFile = file || "code-canvas-architecture.canvas.yaml";
      // If file already includes the directory path, use it directly
      const canvasPath = targetFile.includes("/") ? targetFile : join(CANVAS_DIR, targetFile);

      try {
        if (await exists(canvasPath)) {
          const content = await Deno.readTextFile(canvasPath);
          canvasData = yaml.parse(content) as Canvas;
          const svgContent = renderCanvasToSvg(canvasData);
          const html = generateEditorHtml(targetFile, svgContent);
          return new Response(html, { headers: { "Content-Type": "text/html" } });
        }
      } catch (error) {
        console.error("Error loading canvas:", error);
      }

      return new Response("Canvas file not found", { status: 404 });
    }

    if (path === "/api/canvas") {
      const canvasFile = url.searchParams.get("file") || file ||
        "code-canvas-architecture.canvas.yaml";
      // If file already includes the directory path, use it directly
      const canvasPath = canvasFile.includes("/") ? canvasFile : join(CANVAS_DIR, canvasFile);

      try {
        const content = await Deno.readTextFile(canvasPath);
        canvasData = yaml.parse(content) as Canvas;
        return new Response(JSON.stringify(canvasData), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }

    if (path === "/api/render") {
      const canvasFile = url.searchParams.get("file") || file ||
        "code-canvas-architecture.canvas.yaml";
      // If file already includes the directory path, use it directly
      const canvasPath = canvasFile.includes("/") ? canvasFile : join(CANVAS_DIR, canvasFile);

      try {
        const content = await Deno.readTextFile(canvasPath);
        const canvas = yaml.parse(content) as Canvas;
        const svgContent = renderCanvasToSvg(canvas);
        return new Response(svgContent, {
          headers: { "Content-Type": "image/svg+xml" },
        });
      } catch (error) {
        return new Response("Error rendering canvas", { status: 500 });
      }
    }

    if (path === "/api/file") {
      const filePath = url.searchParams.get("path");
      if (!filePath) {
        return new Response("Missing file path", { status: 400 });
      }

      try {
        const content = await Deno.readTextFile(filePath);
        return new Response(content, {
          headers: { "Content-Type": "text/plain" },
        });
      } catch (error) {
        return new Response(`Error reading file: ${error.message}`, { status: 500 });
      }
    }

    if (path === "/api/edit-file" && req.method === "POST") {
      const body = await req.json();
      const filePath = body.path;

      try {
        // Open file in VS Code (this would need to be implemented based on your setup)
        const command = new Deno.Command("code", { args: [filePath] });
        await command.output();
        return new Response("OK");
      } catch (error) {
        return new Response(`Error opening file: ${error.message}`, { status: 500 });
      }
    }

    if (path === "/api/save" && req.method === "POST") {
      const body = await req.json();
      const canvasFile = body.file;
      const canvasData = body.canvas;

      try {
        // If file already includes the directory path, use it directly
        const canvasPath = canvasFile.includes("/") ? canvasFile : join(CANVAS_DIR, canvasFile);
        const yamlContent = yaml.stringify(canvasData);
        await Deno.writeTextFile(canvasPath, yamlContent);
        return new Response("OK");
      } catch (error) {
        return new Response(`Error saving canvas: ${error.message}`, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  };

  const server = Deno.serve({ port }, handler);
  console.log(`🎨 Self-Managing Canvas Server on http://localhost:${port}`);
  console.log(`📁 Canvas directory: ${CANVAS_DIR}`);
  console.log(`📄 Default canvas: ${options.file || "code-canvas-architecture.canvas.yaml"}`);

  // Keep server running
  await server.finished;
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    boolean: ["watch", "help"],
    string: ["file", "port"],
    alias: { h: "help", f: "file", p: "port", w: "watch" },
    default: { watch: true, port: String(DEFAULT_PORT) },
  });

  if (args.help) {
    console.log(`
Self-Managing Canvas Server - Interactive architecture visualization

USAGE:
  deno run -A tools/self-managing-canvas-server.ts [OPTIONS]

OPTIONS:
  -f, --file <FILE>     Canvas file to edit (default: code-canvas-architecture.canvas.yaml)
  -p, --port <PORT>     Server port (default: ${DEFAULT_PORT})
  -w, --watch           Enable file watching (default: true)
  -h, --help            Show this help

EXAMPLES:
  deno run -A tools/self-managing-canvas-server.ts
  deno run -A tools/self-managing-canvas-server.ts --file demo.canvas.yaml --port 8082

FEATURES:
  • Visual application architecture management
  • Drill-down into components (canvas or file view)
  • Self-modifying design system
  • Real-time collaboration support
  • VS Code integration for file editing
    `);
    Deno.exit(0);
  }

  await startServer({
    port: parseInt(args.port as string, 10),
    file: args.file as string | undefined,
    watch: args.watch as boolean,
  });
}
