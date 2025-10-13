<script lang="ts">
  import { canvasStore } from '../stores/canvasStore.js';
  import type { CanvasNode, CanvasEdge } from '../types/canvas.js';

  /**
   * Todo App Architecture Designer
   * Creates a comprehensive canvas layout for a todo application
   * including all project files, dependencies, and build configuration
   */

  function setupTodoAppArchitecture() {
    // Clear existing canvas
    canvasStore.reset();

    // Define the complete todo app architecture
    const todoNodes: CanvasNode[] = [
      // === PROJECT CONFIGURATION ===
      {
        id: 'package-json',
        type: 'config',
        appType: 'config',
        configType: 'package',
        label: '📦 package.json',
        x: 50,
        y: 50,
        w: 150,
        h: 80,
        color: '#8B5CF6',
        filePath: 'package.json',
        configContent: {
          name: 'todo-app',
          dependencies: ['svelte', '@sveltejs/kit', 'uuid'],
          devDependencies: ['typescript', 'vite', '@sveltejs/vite-plugin-svelte']
        }
      },
      {
        id: 'vite-config',
        type: 'config',
        appType: 'config',
        configType: 'vite',
        label: '⚡ vite.config.ts',
        x: 230,
        y: 50,
        w: 150,
        h: 80,
        color: '#8B5CF6',
        filePath: 'vite.config.ts'
      },
      {
        id: 'tsconfig',
        type: 'config',
        appType: 'config',
        configType: 'typescript',
        label: '📘 tsconfig.json',
        x: 410,
        y: 50,
        w: 150,
        h: 80,
        color: '#8B5CF6',
        filePath: 'tsconfig.json'
      },

      // === DEPENDENCIES ===
      {
        id: 'svelte-dep',
        type: 'dependency',
        appType: 'dependency',
        packageName: 'svelte',
        packageVersion: '^4.0.0',
        packageType: 'dependency',
        label: '🎯 Svelte',
        x: 50,
        y: 180,
        w: 120,
        h: 60,
        color: '#FF3E00'
      },
      {
        id: 'sveltekit-dep',
        type: 'dependency',
        appType: 'dependency',
        packageName: '@sveltejs/kit',
        packageVersion: '^1.20.0',
        packageType: 'dependency',
        label: '🔧 SvelteKit',
        x: 190,
        y: 180,
        w: 120,
        h: 60,
        color: '#FF3E00'
      },
      {
        id: 'uuid-dep',
        type: 'dependency',
        appType: 'dependency',
        packageName: 'uuid',
        packageVersion: '^9.0.0',
        packageType: 'dependency',
        label: '🆔 UUID',
        x: 330,
        y: 180,
        w: 120,
        h: 60,
        color: '#10B981'
      },

      // === ROUTES ===
      {
        id: 'root-route',
        type: 'route',
        appType: 'route',
        label: '🏠 / (Root)',
        routePath: '/',
        x: 50,
        y: 310,
        w: 140,
        h: 80,
        color: '#3B82F6',
        filePath: 'src/routes/+page.svelte'
      },
      {
        id: 'todos-route',
        type: 'route',
        appType: 'route',
        label: '📝 /todos',
        routePath: '/todos',
        x: 220,
        y: 310,
        w: 140,
        h: 80,
        color: '#3B82F6',
        filePath: 'src/routes/todos/+page.svelte'
      },
      {
        id: 'about-route',
        type: 'route',
        appType: 'route',
        label: 'ℹ️ /about',
        routePath: '/about',
        x: 390,
        y: 310,
        w: 140,
        h: 80,
        color: '#3B82F6',
        filePath: 'src/routes/about/+page.svelte'
      },

      // === STORES ===
      {
        id: 'todo-store',
        type: 'store',
        appType: 'store',
        storeType: 'writable',
        label: '📊 todoStore',
        x: 50,
        y: 440,
        w: 140,
        h: 80,
        color: '#F59E0B',
        filePath: 'src/lib/stores/todoStore.ts',
        initialState: {
          todos: [],
          filter: 'all'
        }
      },
      {
        id: 'filter-store',
        type: 'store',
        appType: 'store',
        storeType: 'derived',
        label: '🔍 filteredTodos',
        x: 220,
        y: 440,
        w: 140,
        h: 80,
        color: '#F59E0B',
        filePath: 'src/lib/stores/todoStore.ts'
      },

      // === COMPONENTS ===
      {
        id: 'todo-list-comp',
        type: 'component',
        appType: 'component',
        label: '📋 TodoList',
        x: 50,
        y: 570,
        w: 120,
        h: 70,
        color: '#10B981',
        filePath: 'src/lib/components/TodoList.svelte',
        componentProps: {
          todos: 'Todo[]'
        }
      },
      {
        id: 'todo-item-comp',
        type: 'component',
        appType: 'component',
        label: '✅ TodoItem',
        x: 190,
        y: 570,
        w: 120,
        h: 70,
        color: '#10B981',
        filePath: 'src/lib/components/TodoItem.svelte',
        componentProps: {
          todo: 'Todo',
          onToggle: 'function',
          onDelete: 'function'
        }
      },
      {
        id: 'add-todo-comp',
        type: 'component',
        appType: 'component',
        label: '➕ AddTodo',
        x: 330,
        y: 570,
        w: 120,
        h: 70,
        color: '#10B981',
        filePath: 'src/lib/components/AddTodo.svelte',
        componentProps: {
          onAdd: 'function'
        }
      },
      {
        id: 'filter-buttons-comp',
        type: 'component',
        appType: 'component',
        label: '🔘 FilterButtons',
        x: 470,
        y: 570,
        w: 120,
        h: 70,
        color: '#10B981',
        filePath: 'src/lib/components/FilterButtons.svelte',
        componentProps: {
          currentFilter: 'string',
          onFilterChange: 'function'
        }
      },

      // === TYPES ===
      {
        id: 'todo-types',
        type: 'file',
        appType: 'config',
        label: '📄 types.ts',
        x: 50,
        y: 700,
        w: 140,
        h: 60,
        color: '#6366F1',
        filePath: 'src/lib/types/todo.ts'
      },

      // === BUILD TASKS ===
      {
        id: 'build-task',
        type: 'build-task',
        appType: 'build-task',
        taskName: 'build',
        taskCommand: 'vite build',
        label: '🏗️ Build Task',
        x: 590,
        y: 50,
        w: 120,
        h: 60,
        color: '#EF4444'
      },
      {
        id: 'dev-task',
        type: 'build-task',
        appType: 'build-task',
        taskName: 'dev',
        taskCommand: 'vite dev',
        label: '🔄 Dev Server',
        x: 590,
        y: 130,
        w: 120,
        h: 60,
        color: '#EF4444'
      }
    ];

    const todoEdges: CanvasEdge[] = [
      // Configuration dependencies
      { from: 'package-json', to: 'svelte-dep', kind: 'dependency', flowType: 'dependency', label: 'declares' },
      { from: 'package-json', to: 'sveltekit-dep', kind: 'dependency', flowType: 'dependency', label: 'declares' },
      { from: 'package-json', to: 'uuid-dep', kind: 'dependency', flowType: 'dependency', label: 'declares' },
      { from: 'vite-config', to: 'build-task', kind: 'configures', flowType: 'configuration', label: 'configures' },
      { from: 'vite-config', to: 'dev-task', kind: 'configures', flowType: 'configuration', label: 'configures' },

      // Route to store connections
      { from: 'todos-route', to: 'todo-store', kind: 'imports', flowType: 'import', label: 'imports' },
      { from: 'todos-route', to: 'filter-store', kind: 'imports', flowType: 'import', label: 'imports' },

      // Store relationships
      { from: 'todo-store', to: 'filter-store', kind: 'data', flowType: 'data', label: 'derives from' },
      { from: 'todo-store', to: 'todo-types', kind: 'imports', flowType: 'import', label: 'uses types' },

      // Component relationships
      { from: 'todos-route', to: 'todo-list-comp', kind: 'implements', flowType: 'dependency', label: 'renders' },
      { from: 'todos-route', to: 'add-todo-comp', kind: 'implements', flowType: 'dependency', label: 'renders' },
      { from: 'todos-route', to: 'filter-buttons-comp', kind: 'implements', flowType: 'dependency', label: 'renders' },
      { from: 'todo-list-comp', to: 'todo-item-comp', kind: 'implements', flowType: 'dependency', label: 'renders' },

      // Component to store connections
      { from: 'todo-list-comp', to: 'filter-store', kind: 'data', flowType: 'data', label: 'subscribes to' },
      { from: 'add-todo-comp', to: 'todo-store', kind: 'event', flowType: 'event', label: 'updates' },
      { from: 'filter-buttons-comp', to: 'todo-store', kind: 'event', flowType: 'event', label: 'updates filter' },
      { from: 'todo-item-comp', to: 'todo-store', kind: 'event', flowType: 'event', label: 'toggles/deletes' },

      // Type dependencies
      { from: 'todo-list-comp', to: 'todo-types', kind: 'imports', flowType: 'import', label: 'imports Todo' },
      { from: 'todo-item-comp', to: 'todo-types', kind: 'imports', flowType: 'import', label: 'imports Todo' },
      { from: 'add-todo-comp', to: 'todo-types', kind: 'imports', flowType: 'import', label: 'imports Todo' },

      // UUID dependency
      { from: 'add-todo-comp', to: 'uuid-dep', kind: 'imports', flowType: 'import', label: 'generates IDs' }
    ];

    // Load the architecture into the canvas
    todoNodes.forEach(node => canvasStore.addNode(node));
    todoEdges.forEach(edge => canvasStore.addEdge(edge));

    console.log('🎯 Todo App Architecture loaded onto canvas!');
    console.log(`Added ${todoNodes.length} nodes and ${todoEdges.length} edges`);
  }
</script>

<div class="todo-architecture-panel">
  <h3>🎯 Todo App Architecture Designer</h3>
  <p>Design a complete todo application with full project lifecycle management</p>
  
  <div class="actions">
    <button on:click={setupTodoAppArchitecture} class="setup-btn">
      🚀 Load Todo App Architecture
    </button>
  </div>
  
  <div class="info">
    <h4>📋 What this creates:</h4>
    <ul>
      <li>📦 <strong>Project Config:</strong> package.json, vite.config.ts, tsconfig.json</li>
      <li>🔗 <strong>Dependencies:</strong> Svelte, SvelteKit, UUID with versions</li>
      <li>🛣️ <strong>Routes:</strong> /, /todos, /about pages</li>
      <li>📊 <strong>Stores:</strong> todoStore (writable), filteredTodos (derived)</li>
      <li>🧩 <strong>Components:</strong> TodoList, TodoItem, AddTodo, FilterButtons</li>
      <li>📝 <strong>Types:</strong> Todo interface definitions</li>
      <li>🏗️ <strong>Build Tasks:</strong> dev server, production build</li>
      <li>🔗 <strong>Relationships:</strong> Data flow, imports, configuration links</li>
    </ul>
  </div>
</div>

<style>
  .todo-architecture-panel {
    padding: 1.5rem;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    border-radius: 8px;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
    font-size: 1.1rem;
  }

  p {
    margin: 0 0 1rem 0;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .actions {
    margin-bottom: 1.5rem;
  }

  .setup-btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .setup-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .info {
    background: white;
    padding: 1rem;
    border-radius: 6px;
    border-left: 4px solid #3b82f6;
  }

  .info h4 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
    font-size: 0.9rem;
  }

  .info ul {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.85rem;
    line-height: 1.5;
  }

  .info li {
    margin-bottom: 0.25rem;
    color: #4b5563;
  }

  .info strong {
    color: #1f2937;
  }
</style>