import { Agent } from '@mastra/core/agent';

const agent = new Agent({
  name: 'test-agent', 
  instructions: 'You are a test agent',
  model: { provider: 'GOOGLE', name: 'gemini-2.0-flash-exp', toolChoice: 'auto' },
  tools: []
});

console.log('Agent created successfully');
console.log('Agent ID:', agent.id);
console.log('Agent name:', agent.name);

// Check available methods
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(agent))
  .filter(name => name !== 'constructor' && typeof agent[name] === 'function');

console.log('\nAvailable methods:');
methods.forEach(method => {
  console.log('-', method);
});

// Check specific methods
console.log('\nMethod existence check:');
console.log('Has run method:', typeof agent.run === 'function');
console.log('Has generate method:', typeof agent.generate === 'function');
console.log('Has stream method:', typeof agent.stream === 'function');

// Try to see what happens when we call run
console.log('\nTrying to call agent.run():');
try {
  const result = agent.run({ messages: [{ role: 'user', content: 'Hello' }] });
  console.log('Result type:', typeof result);
  console.log('Result:', result);
} catch (error) {
  console.error('Error calling run:', error.message);
}

// Try to call generate instead
console.log('\nTrying to call agent.generate():');
try {
  const result = await agent.generate([{ role: 'user', content: 'Hello' }]);
  console.log('Generate result:', result);
} catch (error) {
  console.error('Error calling generate:', error.message);
}