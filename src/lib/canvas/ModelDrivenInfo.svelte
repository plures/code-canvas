<script lang="ts">
  function showDemo() {
    console.log('🚀 Model-Driven Development Demo');
    console.log('1. Canvas represents actual application architecture');
    console.log('2. FSM states become SvelteKit routes and components'); 
    console.log('3. Transitions become navigation and data flow');
    console.log('4. Changes to canvas generate actual code');
    console.log('5. Team uses canvas as living documentation');
  }
</script>
      <div class="intro-section">
        <p><strong>This canvas represents your actual application architecture!</strong></p>
        <p>Unlike traditional design tools, changes here generate real SvelteKit code.</p>
      </div>

      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">🛣️</div>
          <div class="feature-text">
            <strong>FSM States → Routes</strong><br>
            Each state becomes a SvelteKit page
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">🔄</div>
          <div class="feature-text">
            <strong>Transitions → Navigation</strong><br>
            User flows become routing logic
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">🏪</div>
          <div class="feature-text">
            <strong>Stores → State</strong><br>
            Canvas nodes become reactive stores
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">🔌</div>
          <div class="feature-text">
            <strong>APIs → Endpoints</strong><br>
            Service nodes generate API routes
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">🧩</div>
          <div class="feature-text">
            <strong>Components → UI</strong><br>
            Reusable elements across pages
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-text">
            <strong>Edges → Data Flow</strong><br>
            Connections define how data moves
          </div>
        </div>
      </div>

      <div class="workflow-section">
        <h4>🎯 Development Workflow</h4>
        <div class="workflow-steps">
          <div class="step">
            <span class="step-number">1</span>
            <span class="step-text">Design application behavior using FSM canvas</span>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <span class="step-text">Generate SvelteKit code from visual model</span>
          </div>
          <div class="step">
            <span class="step-number">3</span>
            <span class="step-text">Team uses canvas as living documentation</span>
          </div>
          <div class="step">
            <span class="step-number">4</span>
            <span class="step-text">Code changes sync back to visual model</span>
          </div>
        </div>
      </div>

      <div class="sample-section">
        <h4>📱 Current Sample Application</h4>
        <p>The canvas shows a user authentication flow with:</p>
        <ul>
          <li><strong>Home, Login, Dashboard, Profile</strong> - SvelteKit routes</li>
          <li><strong>User Store, Auth Store</strong> - Reactive state management</li>
          <li><strong>Auth API, User API</strong> - Backend service endpoints</li>
          <li><strong>Navigation, Login Form</strong> - Reusable UI components</li>
          <li><strong>Edges</strong> - Navigation flow and data connections</li>
        </ul>
      </div>

      <div class="action-section">
        <button on:click={showDemo} class="demo-btn">
          🎮 Show Demo in Console
        </button>
        <p class="action-note">
          Try the <strong>Generate Application</strong> button in the Development Panel to see code generation in action!
        </p>
      </div>

<style>
  .mdd-info-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    max-height: 80vh;
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    z-index: 1000;
    overflow-y: auto;
    animation: slideIn 0.3s ease-out;
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
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border-radius: 10px 10px 0 0;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    transition: background 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(255,255,255,0.2);
  }

  .panel-content {
    padding: 1.5rem;
  }

  .intro-section {
    margin-bottom: 1.5rem;
  }

  .intro-section p {
    margin: 0.5rem 0;
    font-size: 0.875rem;
    line-height: 1.4;
    color: #374151;
  }

  .intro-section p:first-child {
    font-weight: 600;
    color: #1f2937;
  }

  .features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .feature-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .feature-icon {
    font-size: 1.5rem;
    min-width: 32px;
    text-align: center;
  }

  .feature-text {
    font-size: 0.75rem;
    line-height: 1.3;
    color: #374151;
  }

  .feature-text strong {
    color: #1f2937;
    display: block;
  }

  .workflow-section {
    margin-bottom: 1.5rem;
  }

  .workflow-section h4 {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
  }

  .workflow-steps {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 6px;
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #f59e0b;
    color: white;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 24px;
  }

  .step-text {
    font-size: 0.75rem;
    color: #92400e;
    line-height: 1.3;
  }

  .sample-section {
    margin-bottom: 1.5rem;
  }

  .sample-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
  }

  .sample-section p {
    margin: 0 0 0.5rem 0;
    font-size: 0.75rem;
    color: #374151;
  }

  .sample-section ul {
    margin: 0;
    padding-left: 1rem;
    font-size: 0.75rem;
    color: #374151;
    line-height: 1.4;
  }

  .sample-section li {
    margin: 0.25rem 0;
  }

  .action-section {
    text-align: center;
  }

  .demo-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 1rem;
  }

  .demo-btn:hover {
    background: #059669;
    transform: translateY(-2px);
  }

  .action-note {
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .action-note strong {
    color: #374151;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .mdd-info-panel {
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      width: auto;
    }
  }
</style>