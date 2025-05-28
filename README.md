# CodeTheorem Chatbot

A web-based chatbot for CodeTheorem that can be embedded on websites. This chatbot uses the GROQ API for AI responses and provides a floating button that expands to a full chatbot UI when clicked.

## Features

- Node.js/Express backend
- GROQ API for AI responses
- Tailwind CSS for styling
- Iframe-based implementation for embedding on websites
- Floating button that expands to full chatbot UI when clicked

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables in `.env` file:
   ```
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL_NAME=llama3-8b-8192
   PORT=3000
   ```
   - Get a GROQ API key from: https://console.groq.com/keys
   - Available models include: `llama3-8b-8192`, `llama3-70b-8192`, `mixtral-8x7b-32768`, etc.

4. Start the server:
   ```
   npm start
   ```

5. Access the chatbot at http://localhost:3000

## Embedding on Websites

To embed the chatbot on your website, add the following iframe to your HTML:

```html
<iframe 
  src="http://your-server-address:3000" 
  style="position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border: none; z-index: 9999;"
  id="chatbot-iframe"
  allow="microphone"
></iframe>
```

## Configuration

The chatbot can be configured through environment variables:

- `GROQ_API_KEY`: Your GROQ API key (required)
- `GROQ_MODEL_NAME`: The AI model to use (default: llama3-8b-8192)
- `PORT`: The port to run the server on (default: 3000)

## License

MIT
