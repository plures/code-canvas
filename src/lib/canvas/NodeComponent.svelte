<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CanvasNode } from '../types/canvas.js';

  export let node: CanvasNode;
  export let mode: 'canvas' | 'fsm' = 'canvas';

  const dispatch = createEventDispatcher();
  
  let isEditing = false;
  let editingText = '';
  let inputElement: HTMLInputElement;

  function handleMouseDown(event: MouseEvent) {
    event.stopPropagation();
    dispatch('mousedown', {
      node,
      clientX: event.clientX,
      clientY: event.clientY,
      isShiftPressed: event.shiftKey
    });
  }

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    dispatch('click', { node });
  }

  function handleLabelDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    startEditing();
  }

  function startEditing() {
    isEditing = true;
    editingText = node.label || node.id;
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
    }, 10);
  }

  function finishEditing() {
    if (isEditing && editingText.trim()) {
      dispatch('updateLabel', { nodeId: node.id, newLabel: editingText.trim() });
    }
    isEditing = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      finishEditing();
    } else if (event.key === 'Escape') {
      isEditing = false;
    }
  }

  function handleDelete(event: MouseEvent) {
    event.stopPropagation();
    dispatch('delete');
  }

  function handleDrillDown(event: MouseEvent) {
    event.stopPropagation();
    if (node.ref) {
      dispatch('drilldown', { node });
    }
  }

  $: nodeStyle = getNodeStyle(node.type);
  $: isState = mode === 'fsm' && (node.type === 'fsm' || node.props?.fsmType === 'state');

  function getNodeStyle(type: string) {
    const styles: Record<string, { fill: string; stroke: string; strokeWidth: number }> = {
      box: { fill: '#e1f5fe', stroke: '#01579b', strokeWidth: 2 },
      fsm: { fill: '#f3e5f5', stroke: '#4a148c', strokeWidth: 3 },
      control: { fill: '#e8f5e8', stroke: '#1b5e20', strokeWidth: 2 },
      doc: { fill: '#fff3e0', stroke: '#e65100', strokeWidth: 2 },
      database: { fill: '#fce4ec', stroke: '#880e4f', strokeWidth: 2 },
      text: { fill: '#fff3e0', stroke: '#e65100', strokeWidth: 2 },
      file: { fill: '#e8f5e8', stroke: '#1b5e20', strokeWidth: 2 },
      link: { fill: '#e1f5fe', stroke: '#01579b', strokeWidth: 2 },
      group: { fill: '#f5f5f5', stroke: '#757575', strokeWidth: 1 }
    };
    return styles[type] || styles.box;
  }
</script>

<g
  class="node"
  class:state-node={isState}
  class:initial-state={node.props?.isInitial}
  transform="translate({node.x}, {node.y})"
  on:mousedown={handleMouseDown}
  on:click={handleClick}
  role="button"
  tabindex="0"
>
  <!-- Node background -->
  <rect
    width={node.w || 120}
    height={node.h || 80}
    rx="8"
    fill={nodeStyle.fill}
    stroke={nodeStyle.stroke}
    stroke-width={nodeStyle.strokeWidth}
    class="node-rect"
  />

  <!-- FSM state indicator -->
  {#if isState}
    <circle
      cx={node.w ? node.w - 15 : 105}
      cy="15"
      r="8"
      fill={node.props?.isInitial ? '#4caf50' : '#2196f3'}
      class="state-indicator"
    />
  {/if}

  <!-- Node label -->
  {#if isEditing}
    <foreignObject 
      x={(node.w || 120) / 2 - 50} 
      y={(node.h || 80) / 2 - 10} 
      width="100" 
      height="20"
    >
      <input
        bind:this={inputElement}
        bind:value={editingText}
        on:blur={finishEditing}
        on:keydown={handleKeyDown}
        style="width: 100%; border: 1px solid #2196f3; border-radius: 4px; 
               padding: 2px 4px; font-size: 12px; text-align: center; 
               font-family: system-ui, -apple-system, sans-serif;"
      />
    </foreignObject>
  {:else}
    <text
      x={(node.w || 120) / 2}
      y={(node.h || 80) / 2}
      text-anchor="middle"
      dominant-baseline="middle"
      class="node-label"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="14"
      font-weight="500"
      fill="#333"
      on:dblclick={handleLabelDoubleClick}
      style="cursor: pointer;"
    >
      {node.label || node.id}
    </text>
  {/if}

  <!-- Drill-down indicator -->
  {#if node.ref}
    <g class="drill-down" on:click={handleDrillDown} role="button" tabindex="0">
      <circle
        cx={(node.w || 120) - 20}
        cy={(node.h || 80) - 20}
        r="12"
        fill="#2196f3"
        stroke="white"
        stroke-width="2"
        class="drill-down-icon"
      />
      <text
        x={(node.w || 120) - 20}
        y={(node.h || 80) - 15}
        text-anchor="middle"
        font-size="14"
        font-weight="bold"
        fill="white"
        class="drill-down-text"
      >
        ↓
      </text>
    </g>
  {/if}

  <!-- Delete button -->
  <g class="delete-btn" on:click={handleDelete} role="button" tabindex="0">
    <circle
      cx={(node.w || 120) - 10}
      cy="10"
      r="8"
      fill="#f44336"
      stroke="white"
      stroke-width="1"
      class="delete-icon"
    />
    <text
      x={(node.w || 120) - 10}
      y="14"
      text-anchor="middle"
      font-size="10"
      font-weight="bold"
      fill="white"
    >
      ×
    </text>
  </g>
</g>

<style>
  .node {
    cursor: move;
    transition: all 0.2s ease;
  }

  .node:hover {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
  }

  .node-rect {
    transition: all 0.2s ease;
  }

  .state-node .node-rect {
    stroke-dasharray: none;
  }

  .initial-state .node-rect {
    stroke-width: 4;
    stroke: #4caf50;
  }

  .state-indicator {
    transition: all 0.2s ease;
  }

  .drill-down-icon {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .drill-down-icon:hover {
    fill: #1976d2;
    transform: scale(1.1);
  }

  .delete-btn {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .node:hover .delete-btn {
    opacity: 1;
  }

  .delete-icon {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .delete-icon:hover {
    fill: #d32f2f;
    transform: scale(1.2);
  }

  .node-label {
    pointer-events: none;
    user-select: none;
  }

  .drill-down-text {
    pointer-events: none;
    user-select: none;
  }
</style>