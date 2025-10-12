// Canvas Editor JavaScript - Interactive FSM-aware editing
const GRID_SIZE = parseInt("{{GRID_SIZE}}" || "20");
let canvas = { nodes: [], edges: [] };
let selectedNode = null;
let isDragging = false;
let dragNode = null;
let dragStartX = 0, dragStartY = 0;
let currentZoom = 1;

// Load canvas data from server
async function loadCanvas() {
    const res = await fetch('/api/canvas');
    canvas = await res.json();
    renderNodeList();
    updateStats();
}

// Save canvas to server
async function saveCanvas() {
    try {
        const res = await fetch('/api/canvas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(canvas)
        });
        if (res.ok) {
            showStatus('✅ Saved successfully', 2000);
        } else {
            showStatus('❌ Save failed', 2000);
        }
    } catch (e) {
        showStatus('❌ Save error', 2000);
    }
}

// Initialize drag & drop for nodes
function initDragDrop() {
    const svg = document.querySelector('svg');
    const nodeEls = svg.querySelectorAll('.node');
    
    nodeEls.forEach(nodeEl => {
        const rect = nodeEl.querySelector('rect');
        rect.style.cursor = 'move';
        
        rect.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const nodeId = nodeEl.id.replace('node-', '');
            const node = canvas.nodes.find(n => n.id === nodeId);
            if (!node) return;
            
            isDragging = true;
            dragNode = node;
            const svgPoint = getSvgCoords(e);
            dragStartX = svgPoint.x - node.x;
            dragStartY = svgPoint.y - node.y;
            nodeEl.classList.add('dragging');
            selectNode(nodeId);
        });
    });
    
    svg.addEventListener('mousemove', (e) => {
        if (!isDragging || !dragNode) return;
        
        const svgPoint = getSvgCoords(e);
        let newX = svgPoint.x - dragStartX;
        let newY = svgPoint.y - dragStartY;
        
        // Snap to grid
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        
        dragNode.x = Math.max(0, newX);
        dragNode.y = Math.max(0, newY);
        
        updateNodePosition(dragNode);
        updateEdges();
    });
    
    svg.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            const nodeEl = document.getElementById(`node-${dragNode.id}`);
            if (nodeEl) nodeEl.classList.remove('dragging');
            dragNode = null;
            showStatus('Node moved • Press Save to persist changes');
        }
    });
}

// Get SVG coordinates from mouse event
function getSvgCoords(e) {
    const svg = document.querySelector('svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// Update node position in SVG
function updateNodePosition(node) {
    const nodeEl = document.getElementById(`node-${node.id}`);
    if (!nodeEl) return;
    
    const rect = nodeEl.querySelector('rect');
    const text = nodeEl.querySelector('text');
    
    rect.setAttribute('x', node.x);
    rect.setAttribute('y', node.y);
    text.setAttribute('x', node.x + node.w / 2);
    text.setAttribute('y', node.y + node.h / 2);
    
    nodeEl.setAttribute('data-x', node.x);
    nodeEl.setAttribute('data-y', node.y);
}

// Update all edges after node move
function updateEdges() {
    canvas.edges.forEach(edge => {
        const from = canvas.nodes.find(n => n.id === edge.from);
        const to = canvas.nodes.find(n => n.id === edge.to);
        if (!from || !to) return;
        
        const edgeEl = document.getElementById(`edge-${edge.from}-${edge.to}`);
        if (!edgeEl) return;
        
        const line = edgeEl.querySelector('line');
        const polygon = edgeEl.querySelector('polygon');
        const text = edgeEl.querySelector('text');
        
        const x1 = from.x + from.w / 2;
        const y1 = from.y + from.h / 2;
        const x2 = to.x + to.w / 2;
        const y2 = to.y + to.h / 2;
        
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        
        // Update arrow
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const size = 10;
        const ax1 = x2 - size * Math.cos(angle - Math.PI / 6);
        const ay1 = y2 - size * Math.sin(angle - Math.PI / 6);
        const ax2 = x2 - size * Math.cos(angle + Math.PI / 6);
        const ay2 = y2 - size * Math.sin(angle + Math.PI / 6);
        polygon.setAttribute('points', `${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`);
        
        if (text) {
            text.setAttribute('x', (x1 + x2) / 2);
            text.setAttribute('y', (y1 + y2) / 2 - 5);
        }
    });
}

// Node selection
function selectNode(nodeId) {
    selectedNode = nodeId;
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Update visual selection
    document.querySelectorAll('.node').forEach(el => {
        el.style.opacity = el.id === `node-${nodeId}` ? '1' : '0.4';
    });
    
    // Update list
    document.querySelectorAll('.node-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.id === nodeId);
    });
    
    // Show properties
    document.getElementById('selection-info').innerHTML = `
        <label>ID</label>
        <input type="text" value="${node.id}" disabled>
        <label>Type</label>
        <input type="text" value="${node.type}" disabled>
        <label>Label</label>
        <input type="text" id="edit-label" value="${node.label || node.id}">
        <label>Position</label>
        <div style="display:flex;gap:4px;">
            <input type="number" id="edit-x" value="${node.x}" style="width:50%;">
            <input type="number" id="edit-y" value="${node.y}" style="width:50%;">
        </div>
        <label>Size</label>
        <div style="display:flex;gap:4px;">
            <input type="number" id="edit-w" value="${node.w}" style="width:50%;">
            <input type="number" id="edit-h" value="${node.h}" style="width:50%;">
        </div>
        <div class="btn-group">
            <button class="btn" onclick="applyNodeEdit()">Apply</button>
            <button class="btn" onclick="clearSelection()">Clear</button>
        </div>
    `;
}

function applyNodeEdit() {
    if (!selectedNode) return;
    const node = canvas.nodes.find(n => n.id === selectedNode);
    if (!node) return;
    
    node.label = document.getElementById('edit-label').value;
    node.x = parseInt(document.getElementById('edit-x').value);
    node.y = parseInt(document.getElementById('edit-y').value);
    node.w = parseInt(document.getElementById('edit-w').value);
    node.h = parseInt(document.getElementById('edit-h').value);
    
    updateNodePosition(node);
    updateEdges();
    
    const text = document.querySelector(`#node-${node.id} text`);
    if (text) text.textContent = node.label || node.id;
    
    showStatus('Node updated • Press Save to persist');
}

function clearSelection() {
    selectedNode = null;
    document.querySelectorAll('.node').forEach(el => el.style.opacity = '1');
    document.querySelectorAll('.node-item').forEach(item => item.classList.remove('selected'));
    document.getElementById('selection-info').innerHTML = '<p style="font-size:11px;color:#888;">Click a node to edit</p>';
}

// Node list rendering
function renderNodeList() {
    const list = document.getElementById('node-list');
    list.innerHTML = canvas.nodes.map(node => `
        <div class="node-item" data-id="${node.id}" onclick="selectNode('${node.id}')">
            <div>
                <span class="node-type type-${node.type}">${node.type}</span>
                <span>${node.label || node.id}</span>
            </div>
        </div>
    `).join('');
}

// Modal management
function showModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
}

// Add node modal
function addNode() {
    document.getElementById('modal-title').textContent = 'Create Node';
    document.getElementById('node-id').value = `node-${Date.now()}`;
    document.getElementById('node-label').value = '';
    showModal('node-modal');
}

function confirmNode() {
    const node = {
        id: document.getElementById('node-id').value,
        type: document.getElementById('node-type').value,
        label: document.getElementById('node-label').value,
        x: 100,
        y: 100,
        w: parseInt(document.getElementById('node-width').value),
        h: parseInt(document.getElementById('node-height').value)
    };
    
    if (!node.id || canvas.nodes.find(n => n.id === node.id)) {
        alert('Invalid or duplicate ID');
        return;
    }
    
    canvas.nodes.push(node);
    location.reload(); // Reload to show new node
    closeModal();
}

// Add edge modal
function addEdge() {
    const fromSelect = document.getElementById('edge-from');
    const toSelect = document.getElementById('edge-to');
    
    const options = canvas.nodes.map(n => 
        `<option value="${n.id}">${n.label || n.id}</option>`
    ).join('');
    
    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;
    
    showModal('edge-modal');
}

function confirmEdge() {
    const edge = {
        from: document.getElementById('edge-from').value,
        to: document.getElementById('edge-to').value,
        kind: document.getElementById('edge-kind').value,
        label: document.getElementById('edge-label').value || undefined
    };
    
    if (!edge.from || !edge.to) {
        alert('Select both nodes');
        return;
    }
    
    canvas.edges.push(edge);
    location.reload(); // Reload to show new edge
    closeModal();
}

// Delete selected node/edge
function deleteSelected() {
    if (!selectedNode) {
        alert('No node selected');
        return;
    }
    
    if (!confirm(`Delete node "${selectedNode}" and its edges?`)) return;
    
    canvas.nodes = canvas.nodes.filter(n => n.id !== selectedNode);
    canvas.edges = canvas.edges.filter(e => e.from !== selectedNode && e.to !== selectedNode);
    
    location.reload();
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

function updateZoom() {
    document.getElementById('canvas-svg').style.transform = `scale(${currentZoom})`;
}

function fitToScreen() {
    currentZoom = 1;
    updateZoom();
}

// Export YAML
function downloadYaml() {
    const yaml = `nodes:\n${canvas.nodes.map(n => 
        `  - id: ${n.id}\n    type: ${n.type}\n    label: "${n.label || n.id}"\n    x: ${n.x}\n    y: ${n.y}\n    w: ${n.w}\n    h: ${n.h}`
    ).join('\n')}\n\nedges:\n${canvas.edges.map(e => 
        `  - from: ${e.from}\n    to: ${e.to}\n    kind: ${e.kind}${e.label ? `\n    label: "${e.label}"` : ''}`
    ).join('\n')}`;
    
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas.yaml';
    a.click();
    URL.revokeObjectURL(url);
}

// Status messages
function showStatus(msg, duration = 5000) {
    document.getElementById('status').textContent = msg;
    if (duration > 0) {
        setTimeout(() => {
            document.getElementById('status').textContent = `Ready • Grid: ${GRID_SIZE}px • Snap enabled`;
        }, duration);
    }
}

function updateStats() {
    document.getElementById('stats').textContent = 
        `${canvas.nodes.length} nodes • ${canvas.edges.length} edges`;
}

// Initialize on load
window.addEventListener('load', async () => {
    await loadCanvas();
    initDragDrop();
    showStatus(`Ready • Grid: ${GRID_SIZE}px • Snap enabled`);
});
