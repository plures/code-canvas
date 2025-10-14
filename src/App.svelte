<script lang="ts">
  import { onMount } from 'svelte';
  import CanvasEditor from './lib/canvas/CanvasEditor.svelte';
  import DraggablePanel from './lib/components/DraggablePanel.svelte';
  import MainMenu from './lib/components/MainMenu.svelte';
  import PropertiesPanel from './lib/canvas/PropertiesPanel.svelte';
  import ModelDrivenInfo from './lib/canvas/ModelDrivenInfo.svelte';
  import FSMExecutionPanel from './lib/fsm/FSMExecutionPanel.svelte';
  import FSMValidationPanel from './lib/fsm/FSMValidationPanel.svelte';
  import { canvasStore } from './lib/stores/canvasStore.js';
  import { fsmStore } from './lib/stores/fsmStore.js';
  import { windowManagerStore } from './lib/stores/windowManagerStore.js';
  import { selectionStore } from './lib/stores/selectionStore.js';

  let mode: 'canvas' | 'fsm' = 'canvas';

  // Panel component mapping - only contextual panels that add information to main display
  const panelComponents = {
    'propertiesPanel': PropertiesPanel,
    'modelDrivenInfo': ModelDrivenInfo,
    'fsmExecutionPanel': FSMExecutionPanel,
    'fsmValidationPanel': FSMValidationPanel
  };

  // Load auto-saved data or create sample data
  onMount(() => {
    // Initialize only contextual panels that add information to main display
    windowManagerStore.initializePanel('propertiesPanel', '⚙️ Properties Panel');
    windowManagerStore.initializePanel('modelDrivenInfo', '🏗️ Model-Driven Info');
    windowManagerStore.initializePanel('fsmExecutionPanel', '🔄 FSM Execution');
    windowManagerStore.initializePanel('fsmValidationPanel', '✅ FSM Validation');

    // Set initial positions for better layout
    windowManagerStore.movePanel('propertiesPanel', { x: 850, y: 50 });
    windowManagerStore.movePanel('modelDrivenInfo', { x: 100, y: 500 });
    windowManagerStore.movePanel('fsmExecutionPanel', { x: 50, y: 300 });
    windowManagerStore.movePanel('fsmValidationPanel', { x: 400, y: 300 });

    // Start with completely clean UX - no panels shown by default
    // Only contextual panels are available, everything else is in the main menu

    // Debug logging
    console.log('Window manager initialized with panels');

    // Try to load auto-saved canvas first
    const hasAutoSavedData = canvasStore.loadAutoSavedCanvas();
    
    // Load a sample application FSM that demonstrates Model-Driven Development
    fsmStore.loadFsm({
      initial: 'home',
      context: { user: null, isAuthenticated: false },
      states: [
        { id: 'home', label: 'Home Page' },
        { id: 'login', label: 'Login Page' },
        { id: 'dashboard', label: 'User Dashboard' },
        { id: 'profile', label: 'Profile Page' },
        { id: 'settings', label: 'Settings Page' },
        { id: 'error', label: 'Error Page' }
      ],
      transitions: [
        { from: 'home', to: 'login', guard: '!context.isAuthenticated', event: 'login' },
        { from: 'home', to: 'dashboard', guard: 'context.isAuthenticated', event: 'enter' },
        { from: 'login', to: 'dashboard', guard: 'context.isAuthenticated', event: 'authenticate' },
        { from: 'login', to: 'error', guard: 'loginFailed', event: 'authenticate' },
        { from: 'dashboard', to: 'profile', guard: '', event: 'viewProfile' },
        { from: 'dashboard', to: 'settings', guard: '', event: 'openSettings' },
        { from: 'profile', to: 'dashboard', guard: '', event: 'back' },
        { from: 'settings', to: 'dashboard', guard: '', event: 'back' },
        { from: 'dashboard', to: 'home', guard: '', event: 'logout' },
        { from: 'error', to: 'home', guard: '', event: 'retry' }
      ]
    });
    
    if (!hasAutoSavedData) {
      // Create application architecture sample - each FSM state becomes a route/component
      
      // Route nodes (represent SvelteKit pages)
      canvasStore.addNode({
        id: 'home',
        type: 'route',
        label: 'Home Page',
        x: 150,
        y: 100,
        w: 140,
        h: 90,
        appType: 'route',
        routePath: '/',
        color: '#3b82f6'
      });

      canvasStore.addNode({
        id: 'login',
        type: 'route',
        label: 'Login Page',
        x: 350,
        y: 100,
        w: 140,
        h: 90,
        appType: 'route',
        routePath: '/login',
        color: '#3b82f6'
      });

      canvasStore.addNode({
        id: 'dashboard',
        type: 'route',
        label: 'Dashboard',
        x: 550,
        y: 200,
        w: 140,
        h: 90,
        appType: 'route',
        routePath: '/dashboard',
        color: '#3b82f6'
      });

      canvasStore.addNode({
        id: 'profile',
        type: 'route',
        label: 'Profile Page',
        x: 750,
        y: 100,
        w: 140,
        h: 90,
        appType: 'route',
        routePath: '/profile',
        color: '#3b82f6'
      });

      // Store nodes (represent reactive state)
      canvasStore.addNode({
        id: 'userStore',
        type: 'store',
        label: 'User Store',
        x: 150,
        y: 300,
        w: 120,
        h: 80,
        appType: 'store',
        storeType: 'writable',
        color: '#f59e0b'
      });

      canvasStore.addNode({
        id: 'authStore',
        type: 'store',
        label: 'Auth Store',
        x: 300,
        y: 300,
        w: 120,
        h: 80,
        appType: 'store',
        storeType: 'writable',
        color: '#f59e0b'
      });

      // API nodes (represent backend services)
      canvasStore.addNode({
        id: 'authAPI',
        type: 'api',
        label: 'Auth API',
        x: 450,
        y: 350,
        w: 120,
        h: 80,
        appType: 'api',
        apiMethod: 'POST',
        color: '#8b5cf6'
      });

      canvasStore.addNode({
        id: 'userAPI',
        type: 'api',
        label: 'User API',
        x: 600,
        y: 350,
        w: 120,
        h: 80,
        appType: 'api',
        apiMethod: 'GET',
        color: '#8b5cf6'
      });

      // Component nodes (represent reusable UI components)
      canvasStore.addNode({
        id: 'navbar',
        type: 'component',
        label: 'Navigation Bar',
        x: 450,
        y: 50,
        w: 120,
        h: 70,
        appType: 'component',
        color: '#10b981'
      });

      canvasStore.addNode({
        id: 'loginForm',
        type: 'component',
        label: 'Login Form',
        x: 350,
        y: 220,
        w: 120,
        h: 70,
        appType: 'component',
        color: '#10b981'
      });

      // Application flow edges (navigation and data flow)
      canvasStore.addEdge({
        id: 'home-to-login',
        from: 'home',
        to: 'login',
        label: 'Login Required',
        flowType: 'navigation',
        kind: 'navigation'
      });

      canvasStore.addEdge({
        id: 'login-to-dashboard',
        from: 'login',
        to: 'dashboard',
        label: 'Authentication Success',
        flowType: 'navigation',
        kind: 'navigation'
      });

      canvasStore.addEdge({
        id: 'dashboard-to-profile',
        from: 'dashboard',
        to: 'profile',
        label: 'View Profile',
        flowType: 'navigation',
        kind: 'navigation'
      });

      canvasStore.addEdge({
        id: 'auth-api-connection',
        from: 'authStore',
        to: 'authAPI',
        label: 'Authentication Request',
        flowType: 'api',
        kind: 'api'
      });

      canvasStore.addEdge({
        id: 'user-data-flow',
        from: 'userAPI',
        to: 'userStore',
        label: 'User Data',
        flowType: 'data',
        kind: 'data'
      });

      canvasStore.addEdge({
        id: 'navbar-integration',
        from: 'navbar',
        to: 'dashboard',
        label: 'Navigation Component',
        flowType: 'dependency',
        kind: 'dependency'
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
  <!-- Main Menu System -->
  <MainMenu />
  
  <!-- Mode Toggle in top right -->
  <div class="mode-controls">
    <button on:click={toggleMode} class="mode-toggle">
      {mode === 'canvas' ? '🎨' : '🔄'} {mode.toUpperCase()}
    </button>
  </div>

  <div class="canvas-container">
    <CanvasEditor {mode} width={1000} height={700} />
  </div>



  <!-- Render all visible draggable panels -->
  {#each Object.values($windowManagerStore.panels) as panel (panel.id)}
    {#if panel.isVisible}
      <DraggablePanel 
        panelId={panel.id}
        title={panel.title}
        defaultDockZone={panel.dockZone}
        on:close={() => windowManagerStore.hidePanel(panel.id)}
      >
        <svelte:component this={panelComponents[panel.id]} />
      </DraggablePanel>
    {/if}
  {/each}

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

    .mode-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
  }

  .mode-toggle {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .mode-toggle:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .canvas-container {
    display: flex;
    justify-content: center;
    padding-top: 80px; /* Space for fixed menu and mode toggle */
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
