<script lang="ts">
  import { onMount } from 'svelte';
  import CanvasEditor from './lib/canvas/CanvasEditor.svelte';
  import ProjectManager from './lib/canvas/ProjectManager.svelte';
  import { canvasStore } from './lib/stores/canvasStore.js';
  import { fsmStore } from './lib/stores/fsmStore.js';

  let mode: 'canvas' | 'fsm' = 'canvas';

  // Load auto-saved data or create sample data
  onMount(() => {
    // Try to load auto-saved canvas first
    const hasAutoSavedData = canvasStore.loadAutoSavedCanvas();
    
    // Load a sample FSM for testing execution and editing
    fsmStore.loadFsm({
      initial: 'idle',
      context: { count: 0, maxAttempts: 3 },
      states: [
        { id: 'idle', label: 'Idle State' },
        { id: 'working', label: 'Working State' },
        { id: 'complete', label: 'Complete State' },
        { id: 'error', label: 'Error State' }
      ],
      transitions: [
        { from: 'idle', to: 'working', guard: '', event: 'start' },
        { from: 'working', to: 'complete', guard: 'context.count < 10', event: 'finish' },
        { from: 'working', to: 'error', guard: 'context.count >= 10', event: 'finish' },
        { from: 'complete', to: 'idle', guard: '', event: 'reset' },
        { from: 'error', to: 'idle', guard: '', event: 'reset' },
        { from: 'working', to: 'idle', guard: '', event: 'cancel' }
      ]
    });
    
    if (!hasAutoSavedData) {
      // Create sample data if no auto-saved data exists
      canvasStore.addNode({
        id: 'node1',
        type: 'box',
        label: 'Start Node',
        x: 100,
        y: 100,
        w: 120,
        h: 80
      });

      canvasStore.addNode({
        id: 'node2',
        type: 'fsm',
        label: 'FSM Node',
        x: 300,
        y: 100,
        w: 120,
        h: 80
      });

      canvasStore.addNode({
        id: 'node3',
        type: 'control',
        label: 'End Node',
        x: 500,
        y: 100,
        w: 120,
        h: 80
      });

      // Add sample edges
      canvasStore.addEdge({
        from: 'node1',
        to: 'node2',
        label: 'connects',
        kind: 'implements'
      });

      canvasStore.addEdge({
        from: 'node2',
        to: 'node3',
        label: 'flows to',
        kind: 'triggers'
      });
    }

    // Sample FSM configuration
    const sampleFsm = {
      initial: 'idle',
      states: [
        { id: 'idle', label: 'Idle' },
        { id: 'processing', label: 'Processing' },
        { id: 'complete', label: 'Complete' }
      ],
      transitions: [
        { from: 'idle', to: 'processing', guard: 'start', event: 'start' },
        { from: 'processing', to: 'complete', guard: 'finish', event: 'finish' },
        { from: 'complete', to: 'idle', guard: 'reset', event: 'reset' }
      ]
    };

    fsmStore.loadFsm(sampleFsm);
  });

  function toggleMode() {
    mode = mode === 'canvas' ? 'fsm' : 'canvas';
    canvasStore.setMode(mode);
  }
</script>

<main>
  <div class="header">
    <h1>🎨 Code Canvas - FSM Visual Editor</h1>
    <div class="controls">
      <ProjectManager 
        on:saved={() => console.log('Canvas saved!')}
        on:loaded={() => console.log('Canvas loaded!')}
        on:imported={() => console.log('Canvas imported!')}
      />
      <button on:click={toggleMode} class="mode-toggle">
        Switch to {mode === 'canvas' ? 'FSM' : 'Canvas'} Mode
      </button>
      <span class="mode-indicator">Current: {mode.toUpperCase()}</span>
    </div>
  </div>

  <div class="canvas-container">
    <CanvasEditor {mode} width={1000} height={700} />
  </div>

  <div class="info">
    <p>
      🚀 <strong>Modern Canvas Editor</strong> with Svelte + Robot FSM integration<br/>
      • Double-click to add nodes<br/>
      • Drag nodes to move them<br/>
      • Toggle between Canvas and FSM modes<br/>
      • Built with Robot3, Unum, and PluresDB
    </p>
  </div>
</main>

<style>
  main {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .mode-toggle {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .mode-toggle:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  .mode-indicator {
    font-size: 0.9rem;
    opacity: 0.9;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .canvas-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .info {
    text-align: center;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.6;
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #667eea;
  }

  .info strong {
    color: #333;
  }
</style>
