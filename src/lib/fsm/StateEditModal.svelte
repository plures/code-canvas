<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FsmState } from '../types/fsm.js';

  export let isOpen = false;
  export let state: FsmState | null = null;
  export let isNewState = false;
  export let isInitialState = false;

  const dispatch = createEventDispatcher();

  let editingState: FsmState = {
    id: '',
    label: '',
    allowedPaths: [],
    requiredChores: []
  };

  let makeInitial = false;

  // Initialize editing state when modal opens
  $: if (isOpen && state) {
    editingState = { ...state };
    makeInitial = isInitialState;
  } else if (isOpen && isNewState) {
    editingState = {
      id: `state_${Date.now()}`,
      label: 'New State',
      allowedPaths: [],
      requiredChores: []
    };
    makeInitial = false;
  }

  function handleSave() {
    if (!editingState.id.trim() || !editingState.label.trim()) {
      alert('State ID and Label are required');
      return;
    }

    dispatch('save', {
      state: editingState,
      makeInitial,
      isNew: isNewState
    });
    
    closeModal();
  }

  function handleDelete() {
    if (confirm('Are you sure you want to delete this state?')) {
      dispatch('delete', { stateId: state?.id });
      closeModal();
    }
  }

  function closeModal() {
    isOpen = false;
    editingState = { id: '', label: '', allowedPaths: [], requiredChores: [] };
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSave();
    }
  }
</script>

{#if isOpen}
  <!-- Modal backdrop -->
  <div class="modal-backdrop" on:click={closeModal} on:keydown={handleKeydown} role="presentation">
    <!-- Modal content -->
    <div class="modal-content" on:click|stopPropagation role="dialog" aria-labelledby="modal-title">
      <div class="modal-header">
        <h3 id="modal-title">
          {isNewState ? 'Create New State' : 'Edit State'}
        </h3>
        <button class="close-btn" on:click={closeModal} aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- State ID -->
        <div class="form-group">
          <label for="state-id">State ID *</label>
          <input
            id="state-id"
            type="text"
            bind:value={editingState.id}
            placeholder="unique_state_id"
            class="form-input"
            disabled={!isNewState}
            required
          />
          {#if !isNewState}
            <small class="form-hint">State ID cannot be changed after creation</small>
          {/if}
        </div>

        <!-- State Label -->
        <div class="form-group">
          <label for="state-label">Display Label *</label>
          <input
            id="state-label"
            type="text"
            bind:value={editingState.label}
            placeholder="Readable state name"
            class="form-input"
            required
          />
        </div>

        <!-- Initial state checkbox -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked={makeInitial}
              class="checkbox-input"
            />
            Make this the initial state
          </label>
          {#if makeInitial}
            <small class="form-hint">This will become the starting state of the FSM</small>
          {/if}
        </div>

        <!-- Allowed paths (future feature) -->
        <div class="form-group">
          <label for="allowed-paths">Allowed Paths (Advanced)</label>
          <textarea
            id="allowed-paths"
            bind:value={editingState.allowedPaths}
            placeholder="Enter allowed path patterns, one per line"
            class="form-textarea"
            rows="3"
            disabled
          ></textarea>
          <small class="form-hint">Advanced feature - coming soon</small>
        </div>
      </div>

      <div class="modal-footer">
        <div class="button-group">
          {#if !isNewState}
            <button class="btn btn-danger" on:click={handleDelete}>
              🗑️ Delete State
            </button>
          {/if}
          <button class="btn btn-secondary" on:click={closeModal}>
            Cancel
          </button>
          <button class="btn btn-primary" on:click={handleSave}>
            {isNewState ? 'Create State' : 'Save Changes'}
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
    max-width: 500px;
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

  .form-input, .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input:disabled, .form-textarea:disabled {
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