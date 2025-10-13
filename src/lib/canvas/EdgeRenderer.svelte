<script lang="ts">
  import type { CanvasEdge, CanvasNode } from '../types/canvas.js';

  export let edge: CanvasEdge;
  export let nodes: CanvasNode[];

  $: fromNode = nodes.find(n => n.id === edge.from || n.id === edge.fromNode);
  $: toNode = nodes.find(n => n.id === edge.to || n.id === edge.toNode);

  $: path = calculatePath(fromNode, toNode);
  $: edgeStyle = getEdgeStyle(edge.kind);

  function calculatePath(from: CanvasNode | undefined, to: CanvasNode | undefined) {
    if (!from || !to) return '';

    const fromX = from.x + (from.w || 120) / 2;
    const fromY = from.y + (from.h || 80) / 2;
    const toX = to.x + (to.w || 120) / 2;
    const toY = to.y + (to.h || 80) / 2;

    // Calculate connection points on node edges
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return '';

    const fromRadius = Math.min(from.w || 120, from.h || 80) / 2;
    const toRadius = Math.min(to.w || 120, to.h || 80) / 2;

    const startX = fromX + (dx / distance) * fromRadius;
    const startY = fromY + (dy / distance) * fromRadius;
    const endX = toX - (dx / distance) * toRadius;
    const endY = toY - (dy / distance) * toRadius;

    // Create curved path for better visual appeal
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    // Add curve based on edge type
    const curvature = edge.kind === 'guards' ? 30 : 20;
    const perpX = -dy / distance * curvature;
    const perpY = dx / distance * curvature;

    return `M ${startX} ${startY} Q ${midX + perpX} ${midY + perpY} ${endX} ${endY}`;
  }

  function getEdgeStyle(kind: string = 'implements') {
    const styles: Record<string, { stroke: string; strokeDasharray: string; strokeWidth: number }> = {
      triggers: { stroke: '#d32f2f', strokeDasharray: '5,5', strokeWidth: 2 },
      guards: { stroke: '#1976d2', strokeDasharray: '10,2', strokeWidth: 2 },
      tests: { stroke: '#388e3c', strokeDasharray: '3,3', strokeWidth: 2 },
      implements: { stroke: '#f57c00', strokeDasharray: 'none', strokeWidth: 2 },
      docs: { stroke: '#7b1fa2', strokeDasharray: '8,4', strokeWidth: 2 }
    };
    return styles[kind] || styles.implements;
  }

  function getLabelPosition(from: CanvasNode | undefined, to: CanvasNode | undefined) {
    if (!from || !to) return { x: 0, y: 0 };

    const fromX = from.x + (from.w || 120) / 2;
    const fromY = from.y + (from.h || 80) / 2;
    const toX = to.x + (to.w || 120) / 2;
    const toY = to.y + (to.h || 80) / 2;

    return {
      x: (fromX + toX) / 2,
      y: (fromY + toY) / 2 - 10
    };
  }

  $: labelPos = getLabelPosition(fromNode, toNode);
</script>

{#if fromNode && toNode}
  <g class="edge" class:guard-edge={edge.kind === 'guards'}>
    <!-- Edge path -->
    <path
      d={path}
      fill="none"
      stroke={edgeStyle.stroke}
      stroke-width={edgeStyle.strokeWidth}
      stroke-dasharray={edgeStyle.strokeDasharray}
      marker-end="url(#arrowhead)"
      class="edge-path"
    />

    <!-- Edge label -->
    {#if edge.label}
      <g class="edge-label">
        <!-- Label background -->
        <rect
          x={labelPos.x - (edge.label.length * 4)}
          y={labelPos.y - 8}
          width={edge.label.length * 8}
          height="16"
          rx="4"
          fill="white"
          stroke={edgeStyle.stroke}
          stroke-width="1"
          opacity="0.9"
        />
        <!-- Label text -->
        <text
          x={labelPos.x}
          y={labelPos.y + 3}
          text-anchor="middle"
          font-family="system-ui, -apple-system, sans-serif"
          font-size="12"
          font-weight="500"
          fill="#333"
          class="label-text"
        >
          {edge.label}
        </text>
      </g>
    {/if}
  </g>
{/if}

<style>
  .edge {
    pointer-events: none;
  }

  .edge-path {
    transition: all 0.2s ease;
  }

  .edge:hover .edge-path {
    stroke-width: 3;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .guard-edge .edge-path {
    stroke-width: 3;
  }

  .edge-label {
    pointer-events: none;
  }

  .label-text {
    pointer-events: none;
    user-select: none;
  }

  /* Animation for new edges */
  .edge-path {
    stroke-dashoffset: 0;
    animation: drawEdge 0.5s ease-out;
  }

  @keyframes drawEdge {
    from {
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
    }
    to {
      stroke-dasharray: inherit;
      stroke-dashoffset: 0;
    }
  }
</style>