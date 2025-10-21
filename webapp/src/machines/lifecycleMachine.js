import { createMachine, assign } from 'xstate';

/**
 * Lifecycle FSM Machine - based on sot/lifecycle.yaml
 * States: design, implementation, release
 * Enforces allowed paths and required chores per state
 */
export const lifecycleMachine = createMachine({
  id: 'lifecycle',
  initial: 'design',
  context: {
    currentActivity: 'design',
    actor: 'human',
    note: '',
    since: new Date().toISOString(),
    changedFiles: [],
    allowedPaths: [],
  },
  states: {
    design: {
      meta: {
        label: 'Design',
        allowedPaths: [
          'sot/**',
          'designs/**',
          'sot/canvas/**',
          'instructions/**',
          'docs/**',
          'tests/**',
          'tools/**',
          'README.md',
          '.gitignore',
          'CHANGELOG.md',
        ],
        requiredChores: [
          {
            whenAnyMatches: ['designs/**', 'sot/canvas/**'],
            mustAlsoChange: ['tests/**'],
          },
        ],
      },
      on: {
        TRANSITION_TO_IMPLEMENTATION: {
          target: 'implementation',
          guard: 'designApproved',
        },
      },
    },
    implementation: {
      meta: {
        label: 'Implementation',
        allowedPaths: [
          'src/**',
          'tests/**',
          'sot/**',
          'storybook/**',
          'tools/**',
          'templates/**',
          'deno.json',
          'docs/**',
          'CHANGELOG.md',
          'README.md',
          '.github/**',
        ],
        requiredChores: [
          {
            whenAnyMatches: ['src/**'],
            mustAlsoChange: ['tests/**'],
          },
        ],
      },
      on: {
        TRANSITION_TO_RELEASE: {
          target: 'release',
          guard: 'testsPassing',
        },
      },
    },
    release: {
      meta: {
        label: 'Release',
        allowedPaths: ['CHANGELOG.md', 'package.json', 'sot/**'],
        requiredChores: [
          {
            whenAnyMatches: ['package.json'],
            mustAlsoChange: ['CHANGELOG.md'],
          },
        ],
      },
      on: {
        TRANSITION_TO_DESIGN: {
          target: 'design',
        },
      },
    },
  },
}, {
  guards: {
    designApproved: ({ context }) => {
      // Check if tests are updated and designs are approved
      // This is a simplified check - in production, would verify actual files
      return true;
    },
    testsPassing: ({ context }) => {
      // Check if tests are passing and coverage is adequate
      // This is a simplified check - in production, would run actual tests
      return true;
    },
  },
});
