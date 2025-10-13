<script lang="ts">
  import { onMount } from 'svelte';
  import type { RobotMachine, StatePosition, TransitionPath, FsmState, FsmTransition } from '../types/fsm.js';
  import { fsmStore, currentFsmState, fsmConfig } from '../stores/fsmStore.js';
  import FSMExecutionPanel from './FSMExecutionPanel.svelte';
  import StateEditModal from './StateEditModal.svelte';
  import TransitionEditModal from './TransitionEditModal.svelte';
  import FSMValidationPanel from './FSMValidationPanel.svelte';

  export let machine: RobotMachine | undefined = undefined;

  // Modal state
  let stateEditModal = { isOpen: false, state: null as FsmState | null, isNew: false };
  let transitionEditModal = { isOpen: false, transition: null as FsmTransition | null, isNew: false };
  let validationPanelOpen = false;

  // Edit mode
  let editMode = false;

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
    if (editMode) {
      // Open state editing modal
      const state = $fsmConfig?.states.find(s => s.id === stateId);
      if (state) {
        stateEditModal = {
          isOpen: true,
          state,
          isNew: false
        };
      }
    } else {
      // In execution mode - could trigger state selection or show info
      console.log(`Clicked state: ${stateId}`);
    }
  }

  function handleTransitionClick(transition: TransitionPath) {
    if (editMode) {
      // Open transition editing modal
      const fsmTransition = $fsmConfig?.transitions.find(
        t => t.from === transition.from && t.to === transition.to
      );
      if (fsmTransition) {
        transitionEditModal = {
          isOpen: true,
          transition: fsmTransition,
          isNew: false
        };
      }
    }
  }

  function handleCanvasDoubleClick(event: MouseEvent) {
    if (!editMode || !$fsmConfig) return;
    
    // Get click position relative to SVG
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Create new state at click position
    // For now, we'll open the state creation modal
    stateEditModal = {
      isOpen: true,
      state: null,
      isNew: true
    };
  }

  // Modal event handlers
  function handleStateSave(event: CustomEvent) {
    const { state, makeInitial, isNew } = event.detail;
    
    if (isNew) {
      fsmStore.addState(state);
    } else {
      // Update existing state
      fsmStore.updateState(state);
    }
    
    if (makeInitial) {
      fsmStore.setInitialState(state.id);
    }
  }

  function handleStateDelete(event: CustomEvent) {
    const { stateId } = event.detail;
    fsmStore.removeState(stateId);
  }

  function handleTransitionSave(event: CustomEvent) {
    const { transition, isNew } = event.detail;
    
    if (isNew) {
      fsmStore.addTransition(transition);
    } else {
      // Update existing transition
      fsmStore.updateTransition(transition);
    }
  }

  function handleTransitionDelete(event: CustomEvent) {
    const { from, to } = event.detail;
    fsmStore.removeTransition(from, to);
  }

  onMount(() => {
    if ($fsmConfig) {
      calculateLayout($fsmConfig);
    }
  });
</script>

<div class="fsm-visualizer">
  <!-- FSM Visualization -->
  <div class="fsm-diagram">
    <!-- Edit mode toolbar -->
    <div class="fsm-toolbar">
      <label class="edit-mode-toggle">
        <input
          type="checkbox"
          bind:checked={editMode}
        />
        <span class="toggle-label">
          {editMode ? '✏️ Edit Mode' : '▶️ View Mode'}
        </span>
      </label>
      {#if editMode}
        <button 
          class="btn btn-sm btn-primary"
          on:click={() => stateEditModal = { isOpen: true, state: null, isNew: true }}
        >
          ➕ Add State
        </button>
      {/if}
      <button 
        class="btn btn-sm btn-secondary"
        on:click={() => validationPanelOpen = !validationPanelOpen}
        class:active={validationPanelOpen}
      >
        🔍 Validate
      </button>
    </div>

    <svg 
      width={svgWidth} 
      height={svgHeight} 
      class="fsm-svg"
      on:dblclick={handleCanvasDoubleClick}
    >
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
      <g class="transition" class:clickable={editMode}>
        <path
          d={transition.path}
          fill="none"
          stroke="#1976d2"
          stroke-width="2"
          marker-end="url(#fsm-arrowhead)"
          class="transition-path"
          role={editMode ? 'button' : undefined}
          tabindex={editMode ? 0 : undefined}
          on:click={editMode ? () => handleTransitionClick(transition) : undefined}
          on:keydown={editMode ? (e) => e.key === 'Enter' && handleTransitionClick(transition) : undefined}
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
            role={editMode ? 'button' : undefined}
            tabindex={editMode ? 0 : undefined}
            on:click={editMode ? () => handleTransitionClick(transition) : undefined}
            on:keydown={editMode ? (e) => e.key === 'Enter' && handleTransitionClick(transition) : undefined}
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

  <!-- FSM Execution Panel -->
  <div class="fsm-controls">
    <FSMExecutionPanel />
  </div>
</div>

<!-- State Edit Modal -->
<StateEditModal
  bind:isOpen={stateEditModal.isOpen}
  state={stateEditModal.state}
  isNewState={stateEditModal.isNew}
  isInitialState={stateEditModal.state?.id === $fsmConfig?.initial}
  on:save={handleStateSave}
  on:delete={handleStateDelete}
/>

<!-- Transition Edit Modal -->
<TransitionEditModal
  bind:isOpen={transitionEditModal.isOpen}
  transition={transitionEditModal.transition}
  isNewTransition={transitionEditModal.isNew}
  availableStates={$fsmConfig?.states.map(s => s.id) || []}
  on:save={handleTransitionSave}
  on:delete={handleTransitionDelete}
/>

<!-- FSM Validation Panel -->
<FSMValidationPanel
  bind:isOpen={validationPanelOpen}
  fsmConfig={$fsmConfig}
/>

<style>
  .fsm-visualizer {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    align-items: flex-start;
    padding: 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .fsm-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
  }

  .edit-mode-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .edit-mode-toggle input[type="checkbox"] {
    margin: 0;
  }

  .toggle-label {
    user-select: none;
  }

  .fsm-controls {
    flex-shrink: 0;
  }

  .btn {
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn-sm {
    padding: 0.375rem 0.5rem;
    font-size: 0.7rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
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

  .btn-secondary.active {
    background: #2563eb;
    color: white;
  }

  .current-state {
    font-size: 14px;
    color: #333;
  }

  .fsm-diagram {
    flex: 1;
  }

  .fsm-controls {
    flex-shrink: 0;
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

  .transition.clickable {
    cursor: pointer;
  }

  .transition.clickable .transition-path {
    pointer-events: stroke;
  }

  .transition.clickable .transition-label {
    pointer-events: auto;
    cursor: pointer;
  }

  .transition.clickable:hover .transition-path {
    stroke: #2563eb;
    stroke-width: 3;
  }

  .transition-label {
    pointer-events: none;
    user-select: none;
    font-family: system-ui, -apple-system, sans-serif;
  }
</style>