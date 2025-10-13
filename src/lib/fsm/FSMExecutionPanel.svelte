<script lang="ts">
  import { fsmStore, currentFsmState, fsmIsRunning, fsmAvailableEvents, fsmEventQueue, fsmHistory } from '../stores/fsmStore.js';

  // Subscribe to store values
  $: currentState = $currentFsmState;
  $: isRunning = $fsmIsRunning;
  $: availableEvents = $fsmAvailableEvents;
  $: eventQueue = $fsmEventQueue;
  $: history = $fsmHistory;

  // Event handlers
  function startExecution() {
    fsmStore.start();
  }

  function stopExecution() {
    fsmStore.stop();
  }

  function resetExecution() {
    fsmStore.reset();
  }

  function sendEvent(eventType: string) {
    fsmStore.sendEvent(eventType);
  }

  function stepForward() {
    if (availableEvents.length > 0) {
      fsmStore.step(availableEvents[0]);
    }
  }
</script>

<div class="fsm-execution-panel">
  <div class="panel-header">
    <h3>FSM Execution Control</h3>
    <div class="status-indicator" class:running={isRunning}>
      {isRunning ? 'Running' : 'Stopped'}
    </div>
  </div>

  <!-- Control buttons -->
  <div class="control-buttons">
    {#if !isRunning}
      <button on:click={startExecution} class="btn btn-primary">
        ▶️ Start
      </button>
    {:else}
      <button on:click={stopExecution} class="btn btn-secondary">
        ⏸️ Stop
      </button>
    {/if}
    
    <button on:click={resetExecution} class="btn btn-tertiary">
      ⏹️ Reset
    </button>
    
    {#if isRunning && availableEvents.length > 0}
      <button on:click={stepForward} class="btn btn-step">
        ⏭️ Step
      </button>
    {/if}
  </div>

  <!-- Current state display -->
  <div class="current-state">
    <strong>Current State:</strong>
    <span class="state-name">{currentState || 'None'}</span>
  </div>

  <!-- Available events -->
  {#if isRunning && availableEvents.length > 0}
    <div class="available-events">
      <h4>Available Events:</h4>
      <div class="event-buttons">
        {#each availableEvents as event}
          <button 
            on:click={() => sendEvent(event)}
            class="btn btn-event"
          >
            {event}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Execution history -->
  <div class="execution-history">
    <h4>Execution History:</h4>
    <div class="history-list">
      {#each history as state, index}
        <div class="history-item" class:current={index === history.length - 1}>
          <span class="step-number">{index + 1}.</span>
          <span class="state-name">{state}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Event queue -->
  {#if eventQueue.length > 0}
    <div class="event-queue">
      <h4>Recent Events:</h4>
      <div class="event-list">
        {#each eventQueue.slice(-5) as event}
          <div class="event-item" class:failed={event.status === 'failed'}>
            <span class="event-type">{event.type}</span>
            <span class="event-status">{event.status}</span>
            <span class="event-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .fsm-execution-panel {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    min-width: 300px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .panel-header h3 {
    margin: 0;
    color: #374151;
  }

  .status-indicator {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    background: #f3f4f6;
    color: #6b7280;
  }

  .status-indicator.running {
    background: #dcfce7;
    color: #16a34a;
  }

  .control-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #f59e0b;
    color: white;
  }

  .btn-secondary:hover {
    background: #d97706;
  }

  .btn-tertiary {
    background: #6b7280;
    color: white;
  }

  .btn-tertiary:hover {
    background: #4b5563;
  }

  .btn-step {
    background: #10b981;
    color: white;
  }

  .btn-step:hover {
    background: #059669;
  }

  .btn-event {
    background: #8b5cf6;
    color: white;
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }

  .btn-event:hover {
    background: #7c3aed;
  }

  .current-state {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 6px;
  }

  .state-name {
    font-family: monospace;
    background: #e2e8f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    margin-left: 0.5rem;
  }

  .available-events {
    margin-bottom: 1rem;
  }

  .available-events h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: #374151;
  }

  .event-buttons {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .execution-history, .event-queue {
    margin-bottom: 1rem;
  }

  .execution-history h4, .event-queue h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: #374151;
  }

  .history-list {
    max-height: 120px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 0.5rem;
    background: #f9fafb;
  }

  .history-item {
    display: flex;
    align-items: center;
    padding: 0.25rem 0;
    font-size: 0.875rem;
  }

  .history-item.current {
    font-weight: 600;
    color: #3b82f6;
  }

  .step-number {
    width: 2rem;
    color: #6b7280;
  }

  .event-list {
    max-height: 100px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 0.5rem;
    background: #f9fafb;
  }

  .event-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
    font-size: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .event-item:last-child {
    border-bottom: none;
  }

  .event-item.failed {
    color: #dc2626;
  }

  .event-type {
    font-weight: 500;
  }

  .event-status {
    color: #6b7280;
    text-transform: capitalize;
  }

  .event-time {
    color: #9ca3af;
  }
</style>