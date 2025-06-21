// Example of correct Mastra v0.10.6 usage
import { createTool } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

// Create a tool using createTool function
const calculatorTool = createTool({
  id: 'calculator',
  description: 'Performs basic mathematical calculations',
  inputSchema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number')
  }),
  outputSchema: z.object({
    result: z.number(),
    operation: z.string()
  }),
  execute: async ({ operation, a, b }) => {
    let result;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        result = a / b;
        break;
    }
    return { result, operation };
  }
});

// Create another tool
const weatherTool = createTool({
  id: 'weather',
  description: 'Gets weather information for a location',
  inputSchema: z.object({
    location: z.string().describe('The location to get weather for')
  }),
  outputSchema: z.object({
    location: z.string(),
    temperature: z.number(),
    condition: z.string()
  }),
  execute: async ({ location }) => {
    // Mock weather data
    return {
      location,
      temperature: 22,
      condition: 'sunny'
    };
  }
});

// Create an agent with tools
const agent = new Agent({
  id: 'my-agent',
  name: 'My Assistant Agent',
  instructions: 'You are a helpful assistant that can perform calculations and check weather.',
  model: {
    provider: 'openai',
    name: 'gpt-4',
    toolChoice: 'auto'
  },
  tools: {
    calculator: calculatorTool,
    weather: weatherTool
  }
});

// Example usage
console.log('Tools created successfully:');
console.log('- Calculator tool ID:', calculatorTool.id);
console.log('- Weather tool ID:', weatherTool.id);
console.log('- Agent ID:', agent.id);
console.log('- Agent tools:', Object.keys(agent.tools));

export { calculatorTool, weatherTool, agent };