<script lang="ts">
  import { onMount } from 'svelte';
  import { canvasStore } from '../stores/canvasStore.js';
  import { fsmStore } from '../stores/fsmStore.js';
  import NodeComponent from './NodeComponent.svelte';
  import EdgeRenderer from './EdgeRenderer.svelte';
  import FSMVisualizer from '../fsm/FSMVisualizer.svelte';

  import { selectionStore, isNodeSelected, isEdgeSelected } from '../stores/selectionStore.js';
  import { viewportStore, viewportTransform } from '../stores/viewportStore.js';
  import type { CanvasNode, CanvasEdge } from '../types/canvas.js';

  export let mode: 'canvas' | 'fsm' = 'canvas';
  export let width: number = 800;
  export let height: number = 600;

  let svgElement: SVGElement;
  let isDragging = false;
  let dragNode: CanvasNode | null = null;
  let dragOffset = { x: 0, y: 0 };
  
  // Edge creation state
  let isCreatingEdge = false;
  let edgeStart: CanvasNode | null = null;
  let tempEdgeTo = { x: 0, y: 0 };

  // Selection state
  $: selection = $selectionStore;

  // Viewport state
  $: viewport = $viewportStore;
  
  // Pan state
  let isPanning = false;
  let lastPanPoint = { x: 0, y: 0 };

  $: nodes = $canvasStore.nodes;
  $: edges = $canvasStore.edges;
  $: currentFsm = $fsmStore.currentMachine;

  function handleNodeMouseDown(event: CustomEvent) {
    const { node, clientX, clientY, isShiftPressed, isCtrlPressed } = event.detail;
    
    // Start edge creation if Shift is pressed
    if (isShiftPressed) {
      isCreatingEdge = true;
      edgeStart = node;
      const rect = svgElement.getBoundingClientRect();
      tempEdgeTo = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      return;
    }
    
    // Handle selection
    if (isCtrlPressed) {
      selectionStore.toggleNode(node.id, true);
    } else {
      selectionStore.selectNode(node.id, false);
    }
    
    isDragging = true;
    dragNode = node;
    
    const rect = svgElement.getBoundingClientRect();
    const screenCoords = viewportStore.worldToScreen(node.x, node.y, viewport);
    dragOffset = {
      x: clientX - rect.left - screenCoords.x,
      y: clientY - rect.top - screenCoords.y
    };
  }

  function handleNodeClick(event: CustomEvent) {
    const { node } = event.detail;
    
    // Complete edge creation if we're in edge creation mode
    if (isCreatingEdge && edgeStart && edgeStart.id !== node.id) {
      canvasStore.addEdge({
        from: edgeStart.id,
        to: node.id,
        label: 'connects',
        kind: 'implements'
      });
      isCreatingEdge = false;
      edgeStart = null;
      return;
    }
    
    // Handle node selection
    console.log('Node clicked:', node);
    selectionStore.selectNode(node.id);
  }

  function handleMouseMove(event: MouseEvent) {
    const rect = svgElement.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    // Update temporary edge position if creating edge
    if (isCreatingEdge) {
      const worldCoords = viewportStore.screenToWorld(screenX, screenY, viewport);
      tempEdgeTo = {
        x: worldCoords.x,
        y: worldCoords.y
      };
      return;
    }
    
    if (!isDragging || !dragNode) return;

    const worldCoords = viewportStore.screenToWorld(screenX - dragOffset.x, screenY - dragOffset.y, viewport);
    canvasStore.updateNode(dragNode.id, { x: worldCoords.x, y: worldCoords.y });
  }

  function handleMouseUp() {
    isDragging = false;
    dragNode = null;
    
    // Cancel edge creation if clicking on empty space
    if (isCreatingEdge) {
      isCreatingEdge = false;
      edgeStart = null;
    }
  }

  function handleCanvasClick(event: MouseEvent) {
    if (event.target === svgElement) {
      // Single click - clear selection if not multi-selecting
      if (event.detail === 1 && !event.ctrlKey) {
        selectionStore.clearSelection();
      }
      
      const rect = svgElement.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      
      // Transform screen coordinates to world coordinates
      const worldCoords = viewportStore.screenToWorld(screenX, screenY, viewport);
      
      // Create new node on double-click
      if (event.detail === 2) {
        canvasStore.addNode({
          id: `node-${Date.now()}`,
          type: mode === 'fsm' ? 'fsm' : 'box',
          label: `New ${mode === 'fsm' ? 'State' : 'Node'}`,
          x: worldCoords.x,
          y: worldCoords.y,
          w: 120,
          h: 80
        });
      }
    }
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    
    const rect = svgElement.getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    
    if (event.deltaY < 0) {
      viewportStore.zoomIn(centerX, centerY);
    } else {
      viewportStore.zoomOut(centerX, centerY);
    }
  }

  function handleMouseDown(event: MouseEvent) {
    if (event.button === 1 || (event.button === 0 && event.altKey)) { // Middle mouse or Alt+left mouse
      event.preventDefault();
      isPanning = true;
      lastPanPoint = { x: event.clientX, y: event.clientY };
    }
  }

  function handlePanMouseMove(event: MouseEvent) {
    if (isPanning) {
      const deltaX = event.clientX - lastPanPoint.x;
      const deltaY = event.clientY - lastPanPoint.y;
      
      viewportStore.pan(deltaX, deltaY);
      lastPanPoint = { x: event.clientX, y: event.clientY };
    }
  }

  function handlePanMouseUp(event: MouseEvent) {
    if (event.button === 1 || isPanning) {
      isPanning = false;
    }
  }

  // Handle edge clicks
  function handleEdgeClick(event: CustomEvent) {
    const { edge, isCtrlPressed } = event.detail;
    
    if (edge.id) {
      if (isCtrlPressed) {
        selectionStore.toggleEdge(edge.id, true);
      } else {
        selectionStore.selectEdge(edge.id, false);
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.target && (event.target as HTMLElement).tagName === 'INPUT') {
      return; // Don't handle shortcuts when typing in inputs
    }

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        if ($selectionStore.nodes.size > 0 || $selectionStore.edges.size > 0) {
          const confirmDelete = confirm(`Delete ${$selectionStore.nodes.size + $selectionStore.edges.size} selected item(s)?`);
          if (confirmDelete) {
            Array.from($selectionStore.nodes).forEach(nodeId => canvasStore.removeNode(nodeId));
            Array.from($selectionStore.edges).forEach(edgeId => canvasStore.removeEdge(edgeId));
            selectionStore.clearSelection();
          }
        }
        break;
      
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          selectionStore.selectAll(nodes, edges);
        }
        break;

      case 'Escape':
        selectionStore.clearSelection();
        break;

      case '=':
      case '+':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          viewportStore.zoomIn();
        }
        break;

      case '-':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          viewportStore.zoomOut();
        }
        break;

      case '0':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          viewportStore.resetZoom();
          viewportStore.centerPan();
        }
        break;

      case 'f':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (nodes.length > 0) {
            viewportStore.fitToContent(nodes);
          }
        }
        break;
    }
  }

  onMount(() => {
    // Set initial viewport size
    viewportStore.setViewportSize(width, height);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    
    // Add pan mouse handlers
    document.addEventListener('mousemove', handlePanMouseMove);
    document.addEventListener('mouseup', handlePanMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handlePanMouseMove);
      document.removeEventListener('mouseup', handlePanMouseUp);
    };
  });
</script>

<div class="canvas-container">

  
  <svg
    bind:this={svgElement}
    {width}
    {height}
    class="canvas-svg"
    on:click={handleCanvasClick}
    on:wheel={handleWheel}
    on:mousedown={handleMouseDown}
  >
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
      </marker>
    </defs>

    <!-- Canvas content with viewport transform -->
    <g transform={$viewportTransform}>
      <!-- Render edges first so they appear behind nodes -->
      {#each edges as edge (edge.id || `${edge.from}-${edge.to}`)}
        <EdgeRenderer
          {edge}
          {nodes}
          isSelected={edge.id ? isEdgeSelected(edge.id, selection) : false}
          on:click={handleEdgeClick}
        />
      {/each}
      
      <!-- Temporary edge during creation -->
      {#if isCreatingEdge && edgeStart}
        <line 
          x1={edgeStart.x + (edgeStart.w || 120) / 2}
          y1={edgeStart.y + (edgeStart.h || 80) / 2}
          x2={tempEdgeTo.x}
          y2={tempEdgeTo.y}
          stroke="#2196f3"
          stroke-width="2"
          stroke-dasharray="5,5"
          marker-end="url(#arrowhead)"
        />
      {/if}

      <!-- Render nodes -->
      {#each nodes as node (node.id)}
        <NodeComponent
          {node}
          {mode}
          isSelected={isNodeSelected(node.id, selection)}
          on:mousedown={handleNodeMouseDown}
          on:click={handleNodeClick}
          on:delete={() => canvasStore.removeNode(node.id)}
          on:updateLabel={(e) => canvasStore.updateNode(e.detail.nodeId, { label: e.detail.newLabel })}
        />
      {/each}
    </g>
  </svg>

  {#if mode === 'fsm' && currentFsm}
    <FSMVisualizer machine={currentFsm} />
  {/if}
</div>



<style>
  .canvas-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    overflow: hidden;
  }

  .canvas-svg {
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.05) 1px,
      transparent 1px
    ),
    linear-gradient(
      rgba(0, 0, 0, 0.05) 1px,
      transparent 1px
    );
    background-size: 20px 20px;
    cursor: crosshair;
  }

  .canvas-svg:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }
</style>