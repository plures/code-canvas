<script>
  import { useMachine } from '@xstate/svelte';
  import { lifecycleMachine } from './machines/lifecycleMachine.js';
  import CanvasEditor from './components/CanvasEditor.svelte';

  // Use lifecycle machine
  const { snapshot: lifecycleSnapshot } = useMachine(lifecycleMachine);
  
  const currentState = $derived(lifecycleSnapshot.value);
  const stateLabel = $derived(
    lifecycleMachine.states[currentState]?.meta?.label || currentState
  );
</script>

<main>
  <header class="app-header">
    <div class="header-content">
      <h1>🎨 Code Canvas</h1>
      <p>Svelte 5 + XState FSM Editor</p>
    </div>
    <div class="lifecycle-indicator">
      <span class="state-badge" class:design={currentState === 'design'} 
            class:implementation={currentState === 'implementation'}
            class:release={currentState === 'release'}>
        {stateLabel}
      </span>
    </div>
  </header>
  
  <CanvasEditor />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    background: #1e1e1e;
    color: #d4d4d4;
  }

  main {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 16px 24px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .header-content h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  .header-content p {
    margin: 4px 0 0 0;
    font-size: 13px;
    opacity: 0.9;
  }

  .lifecycle-indicator {
    display: flex;
    align-items: center;
  }

  .state-badge {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .state-badge.design {
    background: #f3e5f5;
    color: #4a148c;
  }

  .state-badge.implementation {
    background: #e8f5e8;
    color: #1b5e20;
  }

  .state-badge.release {
    background: #fce4ec;
    color: #880e4f;
  }
</style>
