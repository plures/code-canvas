<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FsmTransition } from '../types/fsm.js';

  export let isOpen = false;
  export let transition: FsmTransition | null = null;
  export let isNewTransition = false;
  export let fromStateId = '';
  export let toStateId = '';
  export let availableStates: string[] = [];

  const dispatch = createEventDispatcher();

  let editingTransition: FsmTransition = {
    from: '',
    to: '',
    guard: '',
    event: ''
  };

  let guardConditionEnabled = false;

  // Initialize editing transition when modal opens
  $: if (isOpen && transition) {
    editingTransition = { ...transition };
    guardConditionEnabled = !!transition.guard;
  } else if (isOpen && isNewTransition) {
    editingTransition = {
      from: fromStateId,
      to: toStateId,
      guard: '',
      event: 'advance'
    };
    guardConditionEnabled = false;
  }

  // Update guard condition when checkbox changes
  $: if (!guardConditionEnabled) {
    editingTransition.guard = '';
  }

  function handleSave() {
    if (!editingTransition.from || !editingTransition.to) {
      alert('From and To states are required');
      return;
    }

    if (!editingTransition.event?.trim()) {
      editingTransition.event = 'advance';
    }

    dispatch('save', {
      transition: editingTransition,
      isNew: isNewTransition
    });
    
    closeModal();
  }

  function handleDelete() {
    if (confirm('Are you sure you want to delete this transition?')) {
      dispatch('delete', { 
        from: transition?.from, 
        to: transition?.to 
      });
      closeModal();
    }
  }

  function closeModal() {
    isOpen = false;
    editingTransition = { from: '', to: '', guard: '', event: '' };
    guardConditionEnabled = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSave();
    }
  }

  // Common event types for suggestions
  const commonEvents = [
    'advance', 'start', 'stop', 'reset', 'complete', 'cancel', 
    'next', 'previous', 'submit', 'retry', 'timeout', 'success', 'error'
  ];

  // Guard condition examples
  const guardExamples = [
    'context.count > 5',
    'event.data.valid === true', 
    'context.attempts < 3',
    'event.timestamp > context.lastUpdate'
  ];
</script>

{#if isOpen}
  <!-- Modal backdrop -->
  <div class="modal-backdrop" on:click={closeModal} on:keydown={handleKeydown} role="presentation">
    <!-- Modal content -->
    <div class="modal-content" on:click|stopPropagation role="dialog" aria-labelledby="modal-title">
      <div class="modal-header">
        <h3 id="modal-title">
          {isNewTransition ? 'Create New Transition' : 'Edit Transition'}
        </h3>
        <button class="close-btn" on:click={closeModal} aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- From State -->
        <div class="form-group">
          <label for="from-state">From State *</label>
          {#if isNewTransition}
            <select id="from-state" bind:value={editingTransition.from} class="form-select" required>
              <option value="">Select source state</option>
              {#each availableStates as stateId}
                <option value={stateId}>{stateId}</option>
              {/each}
            </select>
          {:else}
            <input
              id="from-state"
              type="text"
              value={editingTransition.from}
              class="form-input"
              disabled
            />
            <small class="form-hint">Source state cannot be changed after creation</small>
          {/if}
        </div>

        <!-- To State -->
        <div class="form-group">
          <label for="to-state">To State *</label>
          <select id="to-state" bind:value={editingTransition.to} class="form-select" required>
            <option value="">Select target state</option>
            {#each availableStates as stateId}
              <option value={stateId}>{stateId}</option>
            {/each}
          </select>
        </div>

        <!-- Event Type -->
        <div class="form-group">
          <label for="event-type">Event Type</label>
          <input
            id="event-type"
            type="text"
            bind:value={editingTransition.event}
            placeholder="advance"
            class="form-input"
            list="common-events"
          />
          <datalist id="common-events">
            {#each commonEvents as event}
              <option value={event}></option>
            {/each}
          </datalist>
          <small class="form-hint">Event that triggers this transition (defaults to 'advance')</small>
        </div>

        <!-- Guard Condition -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked={guardConditionEnabled}
              class="checkbox-input"
            />
            Add guard condition (conditional logic)
          </label>
        </div>

        {#if guardConditionEnabled}
          <div class="form-group">
            <label for="guard-condition">Guard Condition</label>
            <textarea
              id="guard-condition"
              bind:value={editingTransition.guard}
              placeholder="Enter JavaScript expression (e.g., context.count > 5)"
              class="form-textarea"
              rows="3"
            ></textarea>
            <details class="form-details">
              <summary>Guard Condition Examples</summary>
              <ul class="example-list">
                {#each guardExamples as example}
                  <li>
                    <button 
                      type="button" 
                      class="example-btn"
                      on:click={() => editingTransition.guard = example}
                    >
                      {example}
                    </button>
                  </li>
                {/each}
              </ul>
            </details>
            <small class="form-hint">
              JavaScript expression that must return true for the transition to fire.
              Available: <code>context</code> (FSM context), <code>event</code> (trigger event data)
            </small>
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <div class="button-group">
          {#if !isNewTransition}
            <button class="btn btn-danger" on:click={handleDelete}>
              🗑️ Delete Transition
            </button>
          {/if}
          <button class="btn btn-secondary" on:click={closeModal}>
            Cancel
          </button>
          <button class="btn btn-primary" on:click={handleSave}>
            {isNewTransition ? 'Create Transition' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideIn 0.2s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h3 {
    margin: 0;
    color: #374151;
    font-size: 1.25rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-input:focus, .form-textarea:focus, .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input:disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    font-weight: normal;
    cursor: pointer;
    margin-bottom: 0;
  }

  .checkbox-input {
    width: auto;
    margin-right: 0.5rem;
    margin-bottom: 0;
  }

  .form-hint {
    display: block;
    color: #6b7280;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    font-style: italic;
  }

  .form-details {
    margin-top: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  .form-details summary {
    padding: 0.5rem;
    background: #f9fafb;
    cursor: pointer;
    font-size: 0.75rem;
    color: #374151;
    border-radius: 4px 4px 0 0;
  }

  .form-details[open] summary {
    border-bottom: 1px solid #e5e7eb;
  }

  .example-list {
    list-style: none;
    padding: 0.5rem;
    margin: 0;
  }

  .example-list li {
    margin-bottom: 0.25rem;
  }

  .example-btn {
    background: none;
    border: 1px solid #d1d5db;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    color: #374151;
    font-family: monospace;
    transition: all 0.2s;
  }

  .example-btn:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  code {
    background: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-family: monospace;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 0 0 8px 8px;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.25rem;
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
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }
</style>