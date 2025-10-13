<script lang="ts">
  import { onMount } from 'svelte';
  import type { RobotMachine, StatePosition, TransitionPath } from '../types/fsm.js';
  import { fsmStore, currentFsmState, fsmConfig } from '../stores/fsmStore.js';

  export let machine: RobotMachine | undefined = undefined;

  let positions: StatePosition[] = [];
  let transitions: TransitionPath[] = [];
  let svgWidth = 400;
  let svgHeight = 300;

  $: if ($fsmConfig) {
    calculateLayout($fsmConfig);
  }

  function calculateLayout(config: typeof $fsmConfig) {
    if (!config) return;

    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const radius = Math.min(svgWidth, svgHeight) * 0.3;
    const stateCount = config.states.length;

    // Calculate state positions in a circle
    positions = config.states.map((state, index) => {
      const angle = (2 * Math.PI * index) / stateCount - Math.PI / 2;
      return {
        id: state.id,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        radius: 25
      };
    });

    // Calculate transition paths
    transitions = config.transitions.map(transition => {
      const fromPos = positions.find(p => p.id === transition.from);
      const toPos = positions.find(p => p.id === transition.to);
      
      if (!fromPos || !toPos) return null;

      const path = createTransitionPath(fromPos, toPos);
      return {
        from: transition.from,
        to: transition.to,
        path,
        label: transition.event || 'advance',
        guard: transition.guard
      };
    }).filter(Boolean) as TransitionPath[];
  }

  function createTransitionPath(from: StatePosition, to: StatePosition): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
      // Self-transition (loop)
      const loopRadius = 30;
      return `M ${from.x + 20} ${from.y - 20} 
              A ${loopRadius} ${loopRadius} 0 1 1 ${from.x - 20} ${from.y - 20}`;
    }

    // Calculate connection points
    const fromRadius = from.radius || 25;
    const toRadius = to.radius || 25;
    
    const startX = from.x + (dx / distance) * fromRadius;
    const startY = from.y + (dy / distance) * fromRadius;
    const endX = to.x - (dx / distance) * toRadius;
    const endY = to.y - (dy / distance) * toRadius;

    // Create curved path
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const curvature = 20;
    const perpX = -dy / distance * curvature;
    const perpY = dx / distance * curvature;

    return `M ${startX} ${startY} Q ${midX + perpX} ${midY + perpY} ${endX} ${endY}`;
  }

  function handleStateClick(stateId: string) {
    // Trigger FSM transition
    fsmStore.step();
  }

  function handleStart() {
    fsmStore.start();
  }

  function handleStop() {
    fsmStore.stop();
  }

  function handleReset() {
    fsmStore.reset();
  }

  onMount(() => {
    if ($fsmConfig) {
      calculateLayout($fsmConfig);
    }
  });
</script>

<div class="fsm-visualizer">
  <!-- FSM Controls -->
  <div class="fsm-controls">
    <button on:click={handleStart} class="btn btn-primary">▶️ Start</button>
    <button on:click={handleStop} class="btn btn-secondary">⏸️ Stop</button>
    <button on:click={handleReset} class="btn btn-secondary">⏮️ Reset</button>
    <div class="current-state">
      Current: <strong>{$currentFsmState || 'None'}</strong>
    </div>
  </div>

  <!-- FSM Visualization -->
  <svg width={svgWidth} height={svgHeight} class="fsm-svg">
    <defs>
      <marker
        id="fsm-arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#1976d2" />
      </marker>
    </defs>

    <!-- Render transitions -->
    {#each transitions as transition}
      <g class="transition">
        <path
          d={transition.path}
          fill="none"
          stroke="#1976d2"
          stroke-width="2"
          marker-end="url(#fsm-arrowhead)"
          class="transition-path"
        />
        <!-- Transition label -->
        {#if transition.label}
          <text
            x={positions.find(p => p.id === transition.from)?.x || 0}
            y={positions.find(p => p.id === transition.from)?.y || 0}
            text-anchor="middle"
            font-size="10"
            fill="#666"
            class="transition-label"
          >
            {transition.label}
          </text>
        {/if}
      </g>
    {/each}

    <!-- Render states -->
    {#each positions as position}
      {@const isActive = $currentFsmState === position.id}
      {@const isInitial = $fsmConfig?.initial === position.id}
      
      <g class="state" class:active={isActive} class:initial={isInitial}>
        <!-- State circle -->
        <circle
          cx={position.x}
          cy={position.y}
          r={position.radius}
          fill={isActive ? '#4caf50' : isInitial ? '#2196f3' : '#e0e0e0'}
          stroke={isActive ? '#2e7d32' : isInitial ? '#1976d2' : '#999'}
          stroke-width="3"
          class="state-circle"
          role="button"
          tabindex="0"
          on:click={() => handleStateClick(position.id)}
          on:keydown={(e) => e.key === 'Enter' && handleStateClick(position.id)}
        />
        
        <!-- State label -->
        <text
          x={position.x}
          y={position.y + 5}
          text-anchor="middle"
          font-family="system-ui, -apple-system, sans-serif"
          font-size="12"
          font-weight="600"
          fill={isActive || isInitial ? 'white' : '#333'}
          class="state-label"
        >
          {position.id}
        </text>

        <!-- Initial state indicator -->
        {#if isInitial}
          <circle
            cx={position.x - 35}
            cy={position.y}
            r="3"
            fill="#1976d2"
          />
          <path
            d="M {position.x - 32} {position.y} L {position.x - (position.radius || 25)} {position.y}"
            stroke="#1976d2"
            stroke-width="2"
            marker-end="url(#fsm-arrowhead)"
          />
        {/if}
      </g>
    {/each}
  </svg>
</div>

<style>
  .fsm-visualizer {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .fsm-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .btn {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #2196f3;
    color: white;
  }

  .btn-primary:hover {
    background: #1976d2;
  }

  .btn-secondary {
    background: #666;
    color: white;
  }

  .btn-secondary:hover {
    background: #555;
  }

  .current-state {
    font-size: 14px;
    color: #333;
  }

  .fsm-svg {
    border: 1px solid #eee;
    border-radius: 4px;
    background: #fafafa;
  }

  .state-circle {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .state-circle:hover {
    filter: brightness(1.1);
    transform: scale(1.05);
  }

  .state.active .state-circle {
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  .state-label {
    pointer-events: none;
    user-select: none;
  }

  .transition-path {
    transition: stroke-width 0.2s ease;
  }

  .transition:hover .transition-path {
    stroke-width: 3;
  }

  .transition-label {
    pointer-events: none;
    user-select: none;
    font-family: system-ui, -apple-system, sans-serif;
  }
</style>