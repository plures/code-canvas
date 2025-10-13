// Project Templates
// Defines different project types and their initial structure

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'web' | 'api' | 'fullstack' | 'mobile' | 'desktop';
  initialNodes: any[];
  initialEdges: any[];
  fileStructure: FileStructureNode[];
  dependencies: string[];
  scripts: Record<string, string>;
  devDependencies: string[];
}

export interface FileStructureNode {
  type: 'file' | 'folder';
  name: string;
  path: string;
  content?: string;
  children?: FileStructureNode[];
}

// Basic Web Project Template
export const basicWebTemplate: ProjectTemplate = {
  id: 'basic-web',
  name: 'Basic Web Project',
  description: 'Simple HTML, CSS, JS project',
  icon: '🌐',
  category: 'web',
  initialNodes: [
    {
      id: 'index-html',
      type: 'file',
      label: 'index.html',
      x: 150,
      y: 100,
      w: 120,
      h: 80,
      fileType: 'html',
      filePath: '/index.html'
    },
    {
      id: 'main-css',
      type: 'file', 
      label: 'style.css',
      x: 300,
      y: 100,
      w: 120,
      h: 80,
      fileType: 'css',
      filePath: '/css/style.css'
    },
    {
      id: 'main-js',
      type: 'file',
      label: 'script.js', 
      x: 450,
      y: 100,
      w: 120,
      h: 80,
      fileType: 'javascript',
      filePath: '/js/script.js'
    }
  ],
  initialEdges: [
    {
      id: 'html-css',
      from: 'index-html',
      to: 'main-css',
      type: 'includes',
      label: 'imports'
    },
    {
      id: 'html-js',
      from: 'index-html', 
      to: 'main-js',
      type: 'includes',
      label: 'imports'
    }
  ],
  fileStructure: [
    {
      type: 'file',
      name: 'index.html',
      path: '/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Project</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <h1>Welcome to My Web Project</h1>
    <script src="js/script.js"></script>
</body>
</html>`
    },
    {
      type: 'folder',
      name: 'css',
      path: '/css',
      children: [
        {
          type: 'file',
          name: 'style.css',
          path: '/css/style.css',
          content: `/* Basic styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}`
        }
      ]
    },
    {
      type: 'folder',
      name: 'js',
      path: '/js',
      children: [
        {
          type: 'file',
          name: 'script.js',
          path: '/js/script.js',
          content: `// Main application script
console.log('Welcome to my web project!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded and ready');
});`
        }
      ]
    }
  ],
  dependencies: [],
  devDependencies: [],
  scripts: {}
};

// SvelteKit Template
export const svelteKitTemplate: ProjectTemplate = {
  id: 'sveltekit',
  name: 'SvelteKit Project',
  description: 'Full-stack Svelte application with routing',
  icon: '⚡',
  category: 'fullstack',
  initialNodes: [
    {
      id: 'app-html',
      type: 'file',
      label: 'app.html',
      x: 100,
      y: 50,
      w: 140,
      h: 80,
      fileType: 'html',
      filePath: '/src/app.html'
    },
    {
      id: 'layout-svelte',
      type: 'component',
      label: '+layout.svelte',
      x: 280,
      y: 50,
      w: 140,
      h: 80,
      fileType: 'svelte',
      filePath: '/src/routes/+layout.svelte'
    },
    {
      id: 'page-svelte',
      type: 'component',
      label: '+page.svelte',
      x: 460,
      y: 50,
      w: 140,
      h: 80,
      fileType: 'svelte',
      filePath: '/src/routes/+page.svelte'
    },
    {
      id: 'vite-config',
      type: 'config',
      label: 'vite.config.js',
      x: 100,
      y: 180,
      w: 140,
      h: 80,
      fileType: 'javascript',
      filePath: '/vite.config.js'
    },
    {
      id: 'package-json',
      type: 'config',
      label: 'package.json',
      x: 280,
      y: 180,
      w: 140,
      h: 80,
      fileType: 'json',
      filePath: '/package.json'
    }
  ],
  initialEdges: [
    {
      id: 'layout-page',
      from: 'layout-svelte',
      to: 'page-svelte',
      type: 'contains',
      label: 'wraps'
    }
  ],
  fileStructure: [
    {
      type: 'file',
      name: 'package.json',
      path: '/package.json',
      content: JSON.stringify({
        "name": "my-sveltekit-app",
        "version": "0.0.1",
        "private": true,
        "scripts": {
          "build": "vite build",
          "dev": "vite dev",
          "preview": "vite preview"
        },
        "devDependencies": {
          "@sveltejs/adapter-auto": "^3.0.0",
          "@sveltejs/kit": "^2.0.0",
          "@sveltejs/vite-plugin-svelte": "^4.0.0",
          "svelte": "^5.0.0",
          "vite": "^6.0.0"
        },
        "type": "module"
      }, null, 2)
    }
  ],
  dependencies: [],
  devDependencies: [
    '@sveltejs/adapter-auto',
    '@sveltejs/kit', 
    '@sveltejs/vite-plugin-svelte',
    'svelte',
    'vite'
  ],
  scripts: {
    "build": "vite build",
    "dev": "vite dev", 
    "preview": "vite preview"
  }
};

// React Template  
export const reactTemplate: ProjectTemplate = {
  id: 'react',
  name: 'React Project',
  description: 'React application with Vite',
  icon: '⚛️',
  category: 'web',
  initialNodes: [
    {
      id: 'app-jsx',
      type: 'component',
      label: 'App.jsx',
      x: 200,
      y: 100,
      w: 140,
      h: 80,
      fileType: 'jsx',
      filePath: '/src/App.jsx'
    },
    {
      id: 'main-jsx',
      type: 'file',
      label: 'main.jsx',
      x: 380,
      y: 100,
      w: 140,
      h: 80,
      fileType: 'jsx',
      filePath: '/src/main.jsx'
    },
    {
      id: 'index-html',
      type: 'file',
      label: 'index.html',
      x: 200,
      y: 220,
      w: 140,
      h: 80,
      fileType: 'html',
      filePath: '/index.html'
    }
  ],
  initialEdges: [
    {
      id: 'main-app',
      from: 'main-jsx',
      to: 'app-jsx',
      type: 'imports',
      label: 'renders'
    }
  ],
  fileStructure: [],
  dependencies: ['react', 'react-dom'],
  devDependencies: ['@types/react', '@types/react-dom', '@vitejs/plugin-react', 'vite'],
  scripts: {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
};

// Node.js API Template
export const nodeApiTemplate: ProjectTemplate = {
  id: 'node-api',
  name: 'Node.js API',
  description: 'Express.js REST API with middleware',
  icon: '🚀',
  category: 'api',
  initialNodes: [
    {
      id: 'server-js',
      type: 'service',
      label: 'server.js',
      x: 200,
      y: 100,
      w: 140,
      h: 80,
      fileType: 'javascript',
      filePath: '/src/server.js'
    },
    {
      id: 'routes-users',
      type: 'route',
      label: 'users.js',
      x: 380,
      y: 100,
      w: 140,
      h: 80,
      fileType: 'javascript',
      filePath: '/src/routes/users.js'
    },
    {
      id: 'middleware',
      type: 'service',
      label: 'auth.js',
      x: 200,
      y: 220,
      w: 140,
      h: 80,
      fileType: 'javascript',
      filePath: '/src/middleware/auth.js'
    }
  ],
  initialEdges: [
    {
      id: 'server-routes',
      from: 'server-js',
      to: 'routes-users',
      type: 'imports',
      label: 'uses'
    },
    {
      id: 'routes-middleware',
      from: 'routes-users',
      to: 'middleware',
      type: 'imports',
      label: 'protected by'
    }
  ],
  fileStructure: [],
  dependencies: ['express', 'cors', 'helmet'],
  devDependencies: ['nodemon'],
  scripts: {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  basicWebTemplate,
  svelteKitTemplate,
  reactTemplate,
  nodeApiTemplate
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter(template => template.category === category);
}