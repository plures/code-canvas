<script lang="ts">
  import type { FsmConfig } from '../types/fsm.js';

  export let fsmConfig: FsmConfig | null = null;
  export let isOpen = false;

  interface ValidationIssue {
    type: 'error' | 'warning';
    message: string;
    category: 'states' | 'transitions' | 'general';
  }

  let validationIssues: ValidationIssue[] = [];

  $: if (fsmConfig && isOpen) {
    validateFsm(fsmConfig);
  }

  function validateFsm(config: FsmConfig) {
    validationIssues = [];

    // Check if initial state exists
    if (!config.initial) {
      validationIssues.push({
        type: 'error',
        message: 'No initial state defined',
        category: 'general'
      });
    } else if (!config.states.find(s => s.id === config.initial)) {
      validationIssues.push({
        type: 'error',
        message: `Initial state "${config.initial}" does not exist`,
        category: 'states'
      });
    }

    // Check for states with no outgoing transitions
    const statesWithOutgoing = new Set(config.transitions.map(t => t.from));
    config.states.forEach(state => {
      if (!statesWithOutgoing.has(state.id) && state.id !== config.initial) {
        validationIssues.push({
          type: 'warning',
          message: `State "${state.id}" has no outgoing transitions (potential dead end)`,
          category: 'states'
        });
      }
    });

    // Check for unreachable states
    const reachableStates = new Set([config.initial]);
    const queue = [config.initial];
    
    while (queue.length > 0) {
      const currentState = queue.shift()!;
      config.transitions
        .filter(t => t.from === currentState)
        .forEach(transition => {
          if (!reachableStates.has(transition.to)) {
            reachableStates.add(transition.to);
            queue.push(transition.to);
          }
        });
    }

    config.states.forEach(state => {
      if (!reachableStates.has(state.id)) {
        validationIssues.push({
          type: 'warning',
          message: `State "${state.id}" is unreachable from initial state`,
          category: 'states'
        });
      }
    });

    // Check for invalid transitions (referencing non-existent states)
    const stateIds = new Set(config.states.map(s => s.id));
    config.transitions.forEach(transition => {
      if (!stateIds.has(transition.from)) {
        validationIssues.push({
          type: 'error',
          message: `Transition references non-existent "from" state: "${transition.from}"`,
          category: 'transitions'
        });
      }
      if (!stateIds.has(transition.to)) {
        validationIssues.push({
          type: 'error',
          message: `Transition references non-existent "to" state: "${transition.to}"`,
          category: 'transitions'
        });
      }
    });

    // Check for duplicate transitions
    const transitionKeys = new Set();
    config.transitions.forEach(transition => {
      const key = `${transition.from}->${transition.to}:${transition.event || 'advance'}`;
      if (transitionKeys.has(key)) {
        validationIssues.push({
          type: 'warning',
          message: `Duplicate transition: ${transition.from} → ${transition.to} on "${transition.event || 'advance'}"`,
          category: 'transitions'
        });
      }
      transitionKeys.add(key);
    });

    // Validate guard conditions
    config.transitions.forEach(transition => {
      if (transition.guard && transition.guard.trim()) {
        try {
          // Test guard condition syntax by creating function
          new Function('context', 'event', `return ${transition.guard}`);
        } catch (error) {
          validationIssues.push({
            type: 'error',
            message: `Invalid guard condition in transition ${transition.from} → ${transition.to}: ${error.message}`,
            category: 'transitions'
          });
        }
      }
    });

    // Check for empty states list
    if (config.states.length === 0) {
      validationIssues.push({
        type: 'error',
        message: 'FSM has no states defined',
        category: 'general'
      });
    }
  }

  function closePanel() {
    isOpen = false;
  }

  $: errorCount = validationIssues.filter(issue => issue.type === 'error').length;
  $: warningCount = validationIssues.filter(issue => issue.type === 'warning').length;
  $: isValid = errorCount === 0;
</script>

{#if isOpen}
  <div class="validation-panel" role="dialog" tabindex="-1">
    <div class="panel-header">
      <h3>FSM Validation</h3>
      <div class="validation-summary">
        <span class="status" class:valid={isValid} class:invalid={!isValid}>
          {#if isValid}
            ✅ Valid
          {:else}
            ❌ Invalid
          {/if}
        </span>
        {#if errorCount > 0}
          <span class="error-count">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
        {/if}
        {#if warningCount > 0}
          <span class="warning-count">{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
        {/if}
      </div>
      <button class="close-btn" on:click={closePanel}>×</button>
    </div>

    <div class="panel-body">
      {#if validationIssues.length === 0}
        <div class="no-issues">
          <div class="success-icon">✅</div>
          <h4>FSM is Valid!</h4>
          <p>No validation issues found. Your FSM structure is correct and ready for execution.</p>
        </div>
      {:else}
        <div class="issues-list">
          {#each validationIssues as issue}
            <div class="issue-item" class:error={issue.type === 'error'} class:warning={issue.type === 'warning'}>
              <div class="issue-icon">
                {#if issue.type === 'error'}
                  ❌
                {:else}
                  ⚠️
                {/if}
              </div>
              <div class="issue-content">
                <div class="issue-message">{issue.message}</div>
                <div class="issue-category">{issue.category}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="panel-footer">
      <small class="validation-info">
        Validation checks for unreachable states, missing initial state, invalid guard conditions, and structural issues.
      </small>
    </div>
  </div>
{/if}

<style>
  .validation-panel {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 350px;
    max-height: 80vh;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    overflow: hidden;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #374151;
  }

  .validation-summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status.valid {
    background: #dcfce7;
    color: #16a34a;
  }

  .status.invalid {
    background: #fef2f2;
    color: #dc2626;
  }

  .error-count {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.125rem 0.375rem;
    border-radius: 8px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .warning-count {
    background: #fffbeb;
    color: #d97706;
    padding: 0.125rem 0.375rem;
    border-radius: 8px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .panel-body {
    padding: 1rem;
    max-height: 60vh;
    overflow-y: auto;
  }

  .no-issues {
    text-align: center;
    padding: 2rem 1rem;
  }

  .success-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .no-issues h4 {
    margin: 0 0 0.5rem 0;
    color: #16a34a;
  }

  .no-issues p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .issues-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .issue-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 6px;
    border-left: 3px solid transparent;
  }

  .issue-item.error {
    background: #fef2f2;
    border-left-color: #dc2626;
  }

  .issue-item.warning {
    background: #fffbeb;
    border-left-color: #d97706;
  }

  .issue-icon {
    flex-shrink: 0;
    font-size: 1rem;
  }

  .issue-content {
    flex: 1;
  }

  .issue-message {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    line-height: 1.4;
  }

  .issue-category {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: capitalize;
    margin-top: 0.25rem;
  }

  .panel-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .validation-info {
    color: #6b7280;
    font-size: 0.7rem;
    line-height: 1.3;
  }
</style>