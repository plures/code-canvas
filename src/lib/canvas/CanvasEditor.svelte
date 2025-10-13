<script lang="ts">
  import { onMount } from 'svelte';
  import { canvasStore } from '../stores/canvasStore.js';
  import { fsmStore } from '../stores/fsmStore.js';
  import NodeComponent from './NodeComponent.svelte';
  import EdgeRenderer from './EdgeRenderer.svelte';
  import FSMVisualizer from '../fsm/FSMVisualizer.svelte';
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

  $: nodes = $canvasStore.nodes;
  $: edges = $canvasStore.edges;
  $: currentFsm = $fsmStore.currentMachine;

  function handleNodeMouseDown(event: CustomEvent) {
    const { node, clientX, clientY, isShiftPressed } = event.detail;
    
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
    
    isDragging = true;
    dragNode = node;
    
    const rect = svgElement.getBoundingClientRect();
    dragOffset = {
      x: clientX - rect.left - node.x,
      y: clientY - rect.top - node.y
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
    }
  }

  function handleMouseMove(event: MouseEvent) {
    const rect = svgElement.getBoundingClientRect();
    
    // Update temporary edge position if creating edge
    if (isCreatingEdge) {
      tempEdgeTo = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      return;
    }
    
    if (!isDragging || !dragNode) return;

    const newX = event.clientX - rect.left - dragOffset.x;
    const newY = event.clientY - rect.top - dragOffset.y;

    canvasStore.updateNode(dragNode.id, { x: newX, y: newY });
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
      const rect = svgElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Create new node on double-click
      if (event.detail === 2) {
        canvasStore.addNode({
          id: `node-${Date.now()}`,
          type: mode === 'fsm' ? 'fsm' : 'box',
          label: `New ${mode === 'fsm' ? 'State' : 'Node'}`,
          x,
          y,
          w: 120,
          h: 80
        });
      }
    }
  }

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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

    <!-- Render edges first so they appear behind nodes -->
    {#each edges as edge (edge.id || `${edge.from}-${edge.to}`)}
      <EdgeRenderer {edge} {nodes} />
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
        on:mousedown={handleNodeMouseDown}
        on:click={handleNodeClick}
        on:delete={() => canvasStore.removeNode(node.id)}
        on:updateLabel={(e) => canvasStore.updateNode(e.detail.nodeId, { label: e.detail.newLabel })}
      />
    {/each}
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