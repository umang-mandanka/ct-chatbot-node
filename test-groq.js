// Test file to check Groq API integration using OpenAI compatible client
require('dotenv').config();
const { OpenAI } = require('openai');

// Check if API key is set
if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY environment variable is not set!');
  console.error('Please create a .env file with your GROQ_API_KEY to use this test.');
  console.error('Example: GROQ_API_KEY=your-api-key-here');
  process.exit(1);
}

// Initialize OpenAI client with Groq API key and base URL
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1', // Use Groq's API endpoint
});

console.log('Testing Groq API integration with OpenAI compatible client...');

// Test function to make a simple request to Groq API
async function testGroqAPI() {
  try {
    console.log('Sending test request to Groq API...');
    
    // List available models
    console.log('Fetching available models...');
    const models = await openai.models.list();
    console.log('Available models:', models.data.map(model => model.id));
    
    // Make a simple chat completion request
    console.log('\nTesting chat completion with llama3-8b-8192 model...');
    const chatCompletion = await openai.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for Code Theorem agency.'
        },
        {
          role: 'user',
          content: 'What services does Code Theorem provide?'
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    
    console.log('\nResponse received successfully!');
    console.log('Response content:', chatCompletion.choices[0].message.content);
    console.log('\nGroq API integration test completed successfully!');
  } catch (error) {
    console.error('Error testing Groq API:', error);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

// Run the test
testGroqAPI();
