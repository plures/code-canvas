// Quick Template Test - Verify our project templates create correct canvas structures
import { projectTemplates } from '../lib/templates/projectTemplates.js';

console.log('🧪 Testing Project Templates...\n');

// Test each template structure
Object.entries(projectTemplates).forEach(([key, template]) => {
  console.log(`📋 ${template.name}`);
  console.log(`   Description: ${template.description}`);
  console.log(`   Nodes: ${template.canvasSetup.nodes.length}`);
  console.log(`   Edges: ${template.canvasSetup.edges.length}`);
  console.log(`   Files: ${template.fileStructure.children?.length || 0}\n`);
  
  // Verify each node has required properties
  template.canvasSetup.nodes.forEach(node => {
    if (!node.id || !node.type || !node.label) {
      console.error(`❌ Invalid node in ${template.name}:`, node);
    }
  });
  
  // Verify each edge connects valid nodes
  template.canvasSetup.edges.forEach(edge => {
    const fromExists = template.canvasSetup.nodes.some(n => n.id === edge.from);
    const toExists = template.canvasSetup.nodes.some(n => n.id === edge.to);
    if (!fromExists || !toExists) {
      console.error(`❌ Invalid edge in ${template.name}:`, edge);
    }
  });
});

console.log('✅ Template validation complete!');