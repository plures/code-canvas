<script lang="ts">
  import { viewportStore, zoomLevel } from '../stores/viewportStore.js';
  import { selectionStore, hasSelection } from '../stores/selectionStore.js';
  import { canvasStore } from '../stores/canvasStore.js';

  $: nodes = $canvasStore.nodes;
  $: edges = $canvasStore.edges;

  function zoomIn() {
    viewportStore.zoomIn();
  }

  function zoomOut() {
    viewportStore.zoomOut();
  }

  function resetZoom() {
    viewportStore.resetZoom();
    viewportStore.centerPan();
  }

  function fitToContent() {
    if (nodes.length > 0) {
      viewportStore.fitToContent(nodes);
    }
  }

  function deleteSelected() {
    if (!$hasSelection) return;
    
    const confirmDelete = confirm(`Delete ${$selectionStore.nodes.size + $selectionStore.edges.size} selected item(s)?`);
    if (confirmDelete) {
      Array.from($selectionStore.nodes).forEach(nodeId => canvasStore.removeNode(nodeId));
      Array.from($selectionStore.edges).forEach(edgeId => canvasStore.removeEdge(edgeId));
      selectionStore.clearSelection();
    }
  }

  function selectAll() {
    selectionStore.selectAll(nodes, edges);
  }

  $: zoomPercentage = Math.round($zoomLevel * 100);
</script>

<div class="canvas-toolbar">
  <!-- Zoom Controls -->
  <div class="toolbar-group">
    <button class="toolbar-btn" on:click={zoomOut} title="Zoom Out (Ctrl + -)">
      🔍−
    </button>
    <div class="zoom-display" title="Current Zoom Level">
      {zoomPercentage}%
    </div>
    <button class="toolbar-btn" on:click={zoomIn} title="Zoom In (Ctrl + +)">
      🔍+
    </button>
  </div>

  <!-- View Controls -->
  <div class="toolbar-group">
    <button class="toolbar-btn" on:click={resetZoom} title="Reset View (Ctrl + 0)">
      🎯 Reset
    </button>
    <button class="toolbar-btn" on:click={fitToContent} title="Fit to Content (Ctrl + F)">
      📏 Fit All
    </button>
  </div>

  <!-- Selection Controls -->
  <div class="toolbar-group">
    <button 
      class="toolbar-btn" 
      on:click={selectAll} 
      title="Select All (Ctrl + A)"
    >
      ☑️ All
    </button>
    <button 
      class="toolbar-btn danger" 
      class:disabled={!$hasSelection}
      on:click={deleteSelected} 
      disabled={!$hasSelection}
      title="Delete Selected (Delete)"
    >
      🗑️ Delete
    </button>
  </div>

  <!-- Selection Info -->
  {#if $hasSelection}
    <div class="toolbar-group">
      <div class="selection-info">
        Selected: {$selectionStore.nodes.size} nodes, {$selectionStore.edges.size} edges
      </div>
    </div>
  {/if}
</div>

<style>
  .canvas-toolbar {
    position: absolute;
    top: 1rem;
    left: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.75rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.5rem;
    border-left: 1px solid #e5e7eb;
  }

  .toolbar-group:first-child {
    border-left: none;
    padding-left: 0;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    transition: all 0.2s ease;
    min-width: 2.5rem;
    height: 2rem;
  }

  .toolbar-btn:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
    transform: translateY(-1px);
  }

  .toolbar-btn:active {
    transform: translateY(0);
  }

  .toolbar-btn.danger {
    color: #dc2626;
    border-color: #fca5a5;
  }

  .toolbar-btn.danger:hover {
    background: #fef2f2;
    border-color: #f87171;
  }

  .toolbar-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .zoom-display {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    min-width: 3rem;
    height: 2rem;
  }

  .selection-info {
    font-size: 0.75rem;
    color: #6b7280;
    padding: 0.5rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .canvas-toolbar {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .toolbar-group {
      gap: 0.25rem;
      padding: 0 0.25rem;
    }

    .toolbar-btn {
      min-width: 2rem;
      padding: 0.375rem;
    }

    .selection-info {
      font-size: 0.625rem;
      padding: 0.375rem;
    }
  }
</style>