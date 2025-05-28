require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRoutes = require('./src/routes/chatRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Check for Groq API key
if (!process.env.GROQ_API_KEY) {
  console.log('WARNING: GROQ_API_KEY environment variable is not set!');
  console.log('Please create a .env file with your GROQ_API_KEY to use the chatbot.');
  console.log('Example: GROQ_API_KEY=your-api-key-here');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a simple session store for the application
// This will be used to track used questions per user session
global.sessionStore = new Map();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/chat', chatRoutes);

// Serve the main HTML file for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    error: 'An error occurred on the server',
    errorType: 'server_error',
    message: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Open your browser and navigate to http://localhost:${PORT}`);
});
