<script lang="ts">
  import { canvasStore } from '../stores/canvasStore.js';
  import { selectionStore, selectedNodes, selectedEdges, hasSelection, selectionCount } from '../stores/selectionStore.js';
  import type { CanvasNode, CanvasEdge } from '../types/canvas.js';

  $: nodes = $canvasStore.nodes;
  $: edges = $canvasStore.edges;
  $: selectedNodeIds = $selectedNodes;
  $: selectedEdgeIds = $selectedEdges;
  
  // Get selected elements
  $: selectedNodeElements = nodes.filter(n => selectedNodeIds.includes(n.id));
  $: selectedEdgeElements = edges.filter(e => e.id && selectedEdgeIds.includes(e.id));

  // Determine what to show
  $: showMultipleSelection = $selectionCount > 1;
  $: showSingleNode = selectedNodeElements.length === 1 && selectedEdgeElements.length === 0;
  $: showSingleEdge = selectedEdgeElements.length === 1 && selectedNodeElements.length === 0;

  // Single element editing
  $: editingNode = showSingleNode ? selectedNodeElements[0] : null;
  $: editingEdge = showSingleEdge ? selectedEdgeElements[0] : null;

  // Editing state
  let editingProperty: string | null = null;

  function updateNodeProperty(nodeId: string, property: string, value: any) {
    canvasStore.updateNode(nodeId, { [property]: value });
    editingProperty = null;
  }

  function updateEdgeProperty(edgeId: string, property: string, value: any) {
    canvasStore.updateEdge(edgeId, { [property]: value });
    editingProperty = null;
  }

  function deleteSelected() {
    const confirmDelete = confirm(`Delete ${$selectionCount} selected item(s)?`);
    if (confirmDelete) {
      selectedNodeIds.forEach(nodeId => canvasStore.removeNode(nodeId));
      selectedEdgeIds.forEach(edgeId => canvasStore.removeEdge(edgeId));
      selectionStore.clearSelection();
    }
  }

  function duplicateSelected() {
    selectedNodeIds.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        canvasStore.addNode({
          ...node,
          id: crypto.randomUUID(),
          x: node.x + 50,
          y: node.y + 50,
          label: (node.label || 'Node') + ' Copy'
        });
      }
    });
  }

  // Node types for dropdown
  const nodeTypes = [
    { value: 'box', label: '📦 Box' },
    { value: 'fsm', label: '🎯 FSM' },
    { value: 'control', label: '🎮 Control' },
    { value: 'doc', label: '📄 Document' },
    { value: 'database', label: '🗄️ Database' },
    { value: 'text', label: '📝 Text' },
    { value: 'file', label: '📁 File' },
    { value: 'link', label: '🔗 Link' },
    { value: 'group', label: '📁 Group' }
  ];

  // Edge types for dropdown
  const edgeTypes = [
    { value: 'triggers', label: '⚡ Triggers' },
    { value: 'guards', label: '🛡️ Guards' },
    { value: 'tests', label: '🧪 Tests' },
    { value: 'implements', label: '⚙️ Implements' },
    { value: 'docs', label: '📋 Docs' }
  ];

  function togglePanel() {
    isOpen = !isOpen;
  }

  function handleKeyPress(event: KeyboardEvent, callback: () => void) {
    if (event.key === 'Enter') {
      callback();
    }
  }
</script>
      {#if !$hasSelection}
        <div class="no-selection">
          <div class="no-selection-icon">🎯</div>
          <h4>No Selection</h4>
          <p>Select nodes or edges to view their properties</p>
        </div>
      
      {:else if showMultipleSelection}
        <div class="multi-selection">
          <h4>Multiple Items Selected</h4>
          <div class="selection-stats">
            <div class="stat-item">
              <span class="stat-label">Nodes:</span>
              <span class="stat-value">{selectedNodeElements.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Edges:</span>
              <span class="stat-value">{selectedEdgeElements.length}</span>
            </div>
          </div>
          
          <div class="multi-actions">
            <button class="btn btn-secondary" on:click={duplicateSelected}>
              📋 Duplicate
            </button>
            <button class="btn btn-danger" on:click={deleteSelected}>
              🗑️ Delete
            </button>
          </div>
        </div>

      {:else if showSingleNode && editingNode}
        <div class="single-node">
          <div class="property-header">
            <h4>Node Properties</h4>
            <span class="node-id">#{editingNode.id.slice(0, 8)}...</span>
          </div>
          
          <div class="property-list">
            <!-- Node Type -->
            <div class="property-item">
              <label class="property-label">Type</label>
              <select 
                value={editingNode.type}
                on:change={e => updateNodeProperty(editingNode.id, 'type', e.target.value)}
              >
                {#each nodeTypes as nodeType}
                  <option value={nodeType.value}>{nodeType.label}</option>
                {/each}
              </select>
            </div>

            <!-- Node Label -->
            <div class="property-item">
              <label class="property-label">Label</label>
              {#if editingProperty === 'label'}
                <input 
                  type="text"
                  value={editingNode.label || ''}
                  on:blur={e => updateNodeProperty(editingNode.id, 'label', e.target.value)}
                  on:keypress={e => handleKeyPress(e, () => updateNodeProperty(editingNode.id, 'label', e.target.value))}
                  autofocus
                />
              {:else}
                <div 
                  class="property-value editable"
                  on:click={() => editingProperty = 'label'}
                  role="button"
                  tabindex="0"
                  on:keydown={e => e.key === 'Enter' && (editingProperty = 'label')}
                >
                  {editingNode.label || 'Click to edit'}
                </div>
              {/if}
            </div>

            <!-- Position -->
            <div class="property-item">
              <label class="property-label">Position</label>
              <div class="position-inputs">
                <input 
                  type="number"
                  value={Math.round(editingNode.x)}
                  on:change={e => updateNodeProperty(editingNode.id, 'x', parseFloat(e.target.value))}
                  placeholder="X"
                />
                <input 
                  type="number"
                  value={Math.round(editingNode.y)}
                  on:change={e => updateNodeProperty(editingNode.id, 'y', parseFloat(e.target.value))}
                  placeholder="Y"
                />
              </div>
            </div>

            <!-- Size -->
            <div class="property-item">
              <label class="property-label">Size</label>
              <div class="size-inputs">
                <input 
                  type="number"
                  value={editingNode.width || editingNode.w || 100}
                  on:change={e => updateNodeProperty(editingNode.id, 'width', parseFloat(e.target.value))}
                  placeholder="Width"
                />
                <input 
                  type="number"
                  value={editingNode.height || editingNode.h || 60}
                  on:change={e => updateNodeProperty(editingNode.id, 'height', parseFloat(e.target.value))}
                  placeholder="Height"
                />
              </div>
            </div>

            <!-- Color -->
            <div class="property-item">
              <label class="property-label">Color</label>
              <input 
                type="color"
                value={editingNode.color || '#4a90e2'}
                on:change={e => updateNodeProperty(editingNode.id, 'color', e.target.value)}
              />
            </div>

            <!-- Text Content (for text type) -->
            {#if editingNode.type === 'text' || editingNode.text}
              <div class="property-item">
                <label class="property-label">Text Content</label>
                <textarea 
                  value={editingNode.text || ''}
                  on:change={e => updateNodeProperty(editingNode.id, 'text', e.target.value)}
                  placeholder="Enter text content..."
                  rows="3"
                ></textarea>
              </div>
            {/if}

            <!-- URL (for link type) -->
            {#if editingNode.type === 'link' || editingNode.url}
              <div class="property-item">
                <label class="property-label">URL</label>
                <input 
                  type="url"
                  value={editingNode.url || ''}
                  on:change={e => updateNodeProperty(editingNode.id, 'url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            {/if}

            <!-- File Path (for file type) -->
            {#if editingNode.type === 'file' || editingNode.file}
              <div class="property-item">
                <label class="property-label">File Path</label>
                <input 
                  type="text"
                  value={editingNode.file || ''}
                  on:change={e => updateNodeProperty(editingNode.id, 'file', e.target.value)}
                  placeholder="/path/to/file"
                />
              </div>
            {/if}
          </div>

          <div class="single-actions">
            <button class="btn btn-secondary" on:click={duplicateSelected}>
              📋 Duplicate
            </button>
            <button class="btn btn-danger" on:click={deleteSelected}>
              🗑️ Delete
            </button>
          </div>
        </div>

      {:else if showSingleEdge && editingEdge}
        <div class="single-edge">
          <div class="property-header">
            <h4>Edge Properties</h4>
            <span class="edge-id">#{(editingEdge.id || 'unknown').slice(0, 8)}...</span>
          </div>
          
          <div class="property-list">
            <!-- Edge Type/Kind -->
            <div class="property-item">
              <label class="property-label">Type</label>
              <select 
                value={editingEdge.kind || 'triggers'}
                on:change={e => updateEdgeProperty(editingEdge.id, 'kind', e.target.value)}
              >
                {#each edgeTypes as edgeType}
                  <option value={edgeType.value}>{edgeType.label}</option>
                {/each}
              </select>
            </div>

            <!-- Edge Label -->
            <div class="property-item">
              <label class="property-label">Label</label>
              {#if editingProperty === 'edge-label'}
                <input 
                  type="text"
                  value={editingEdge.label || ''}
                  on:blur={e => updateEdgeProperty(editingEdge.id, 'label', e.target.value)}
                  on:keypress={e => handleKeyPress(e, () => updateEdgeProperty(editingEdge.id, 'label', e.target.value))}
                  autofocus
                />
              {:else}
                <div 
                  class="property-value editable"
                  on:click={() => editingProperty = 'edge-label'}
                  role="button"
                  tabindex="0"
                  on:keydown={e => e.key === 'Enter' && (editingProperty = 'edge-label')}
                >
                  {editingEdge.label || 'Click to edit'}
                </div>
              {/if}
            </div>

            <!-- Connection Info -->
            <div class="property-item">
              <label class="property-label">Connection</label>
              <div class="connection-info">
                <div class="connection-node">From: {editingEdge.from || editingEdge.fromNode || 'Unknown'}</div>
                <div class="connection-arrow">↓</div>
                <div class="connection-node">To: {editingEdge.to || editingEdge.toNode || 'Unknown'}</div>
              </div>
            </div>
          </div>

          <div class="single-actions">
            <button class="btn btn-danger" on:click={deleteSelected}>
              🗑️ Delete
            </button>
          </div>
        </div>
      {/if}

<style>
  .properties-panel {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 300px;
    max-height: 80vh;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow: hidden;
    animation: slideIn 0.2s ease-out;
  }

  .properties-collapsed {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #374151;
    transition: all 0.2s ease;
  }

  .properties-collapsed:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  .expand-icon {
    font-size: 1.2rem;
    color: #6b7280;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #374151;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .panel-body {
    padding: 1rem;
    max-height: 70vh;
    overflow-y: auto;
  }

  .no-selection {
    text-align: center;
    padding: 2rem 1rem;
  }

  .no-selection-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .no-selection h4 {
    margin: 0 0 0.5rem 0;
    color: #374151;
  }

  .no-selection p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .property-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .property-header h4 {
    margin: 0;
    color: #374151;
  }

  .node-id, .edge-id {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
  }

  .property-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .property-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .property-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .property-value {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
    background: white;
  }

  .property-value.editable {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .property-value.editable:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  input, select, textarea {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .position-inputs, .size-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .connection-info {
    background: #f8fafc;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .connection-node {
    font-size: 0.75rem;
    color: #374151;
    padding: 0.25rem 0;
  }

  .connection-arrow {
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .selection-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 4px;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .stat-value {
    font-weight: 600;
    color: #374151;
  }

  .single-actions, .multi-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background: #555;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }
</style>