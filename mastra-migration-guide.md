# Mastra v0.10.6 Migration Guide

## Issue Summary
The `mastra` package version 0.1.46 that was previously installed is a CLI-only package and does not export `createTool` or other SDK functions. The core SDK functionality has been moved to `@mastra/core`.

## Solution: Install @mastra/core

```bash
npm install @mastra/core
```

## Available Exports in @mastra/core v0.10.6

### Core Classes
- `Agent` - Main agent class (prefer importing from `@mastra/core/agent`)
- `Tool` - Tool class
- `Workflow` - Workflow class
- `Integration` - Integration base class
- `Mastra` - Main Mastra class

### Tool and Workflow Creation
- `createTool(opts)` - Creates a new tool instance
- `createWorkflow(args)` - Creates a new workflow
- `createStep(args)` - Creates a workflow step

### Memory and Storage
- `MastraMemory` - Abstract memory base class
- `MastraStorage` - Abstract storage base class  
- `MastraVector` - Abstract vector storage base class

### Utilities
- `withSpan()` - Telemetry span wrapper
- `hasActiveTelemetry()` - Check if telemetry is active
- `Telemetry` - Telemetry management
- `evaluate()` - Evaluation utilities
- `Metric` - Metric definition class

## Correct Usage Examples

### Creating Tools

```javascript
import { createTool } from '@mastra/core';
import { z } from 'zod';

const myTool = createTool({
  id: 'my-tool',
  description: 'Tool description',
  inputSchema: z.object({
    input: z.string()
  }),
  outputSchema: z.object({
    output: z.string()
  }),
  execute: async ({ input }) => {
    return { output: `Processed: ${input}` };
  }
});
```

### Creating Agents

```javascript
import { Agent } from '@mastra/core/agent';
// OR
import { Agent } from '@mastra/core';

const agent = new Agent({
  id: 'my-agent',
  name: 'My Agent',
  instructions: 'You are a helpful assistant.',
  model: {
    provider: 'openai',
    name: 'gpt-4',
    toolChoice: 'auto'
  },
  tools: {
    myTool: myTool
  }
});
```

## Migration Steps

1. **Install the correct package:**
   ```bash
   npm install @mastra/core
   ```

2. **Update your imports:**
   ```javascript
   // Old (doesn't work)
   import { createTool } from 'mastra';
   
   // New (correct)
   import { createTool } from '@mastra/core';
   import { Agent } from '@mastra/core/agent';
   ```

3. **Update your tool creation code** - The API is the same, just the import source changed.

4. **Optional: Remove old CLI package if not needed:**
   ```bash
   npm uninstall mastra
   ```
   (Keep it if you need the CLI commands like `mastra dev`, `mastra build`, etc.)

## Package Differences

- `mastra` (0.1.x) - CLI package only, no SDK exports
- `@mastra/core` (0.10.x) - Main SDK with all core functionality
- Other `@mastra/*` packages - Specialized functionality (memory, vector storage, etc.)

## Additional Packages You Might Need

- `@mastra/memory` - Memory management
- `@mastra/rag` - Retrieval-Augmented Generation
- `@mastra/server` - HTTP server utilities
- `@mastra/client-js` - Client library