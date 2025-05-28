const companyProfile = require('../data/agencyData');
const fetch = require('node-fetch');
const { marked } = require('marked');

// Debug: Log environment variables (do not log actual key in production)
console.log('OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);
console.log('OPENROUTER_MODEL:', process.env.OPENROUTER_MODEL);
console.log('OPENROUTER_API_URL:', process.env.OPENROUTER_API_URL);

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is missing! Please set it in your .env file.');
}

const MODEL_NAME = process.env.OPENROUTER_MODEL || 'mistralai/mixtral-8x7b';
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Process a chat message and get a response from the AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function processMessage(req, res) {
  // Debug: Log incoming request
  console.log('Received chat message request:', req.body);

  const { message } = req.body;
  
  // Validate the message
  function isValidMessage(msg) {
    if (typeof msg !== 'string') return false;
    if (!msg.trim()) return false;
    if (msg.length > 500) return false;
    if (/[<>]/.test(msg)) return false;
    return true;
  }
  
  if (!isValidMessage(message)) {
    return res.status(400).json({ 
      error: "Invalid message: must be 1-500 chars, no < or >, and not empty.",
      errorType: "validation_error" 
    });
  }

  try {
    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required',
        errorType: "validation_error" 
      });
    }

    // Build a comprehensive system prompt using all agency data
    const agency = companyProfile.agency;
    const services = companyProfile.services;
    const systemPrompt = `
You are the official, friendly, and professional chatbot for **${agency.name}**. Follow these rules without exception:

---

**🧠 GENERAL BEHAVIOR**
- Always speak on behalf of **${agency.name}** using **"we"**, never "they" or "the company"
- Respond with confidence and clarity
- Sound human, warm, and professional — never robotic or overly brief
- Use bullet points or numbered lists if appropriate
- Keep responses between **40 and 120 words**, unless the answer requires more

---

**🚫 STRICTLY AVOID**
- Speculating or guessing
- Using the words: "data", "information", "provided", "unfortunately"
- Mentioning anything not clearly defined below

---

**🏢 Agency Overview**
- **About Us:** ${agency.description}
- **Mission:** ${agency.mission}
- **Tagline:** ${agency.tagline}
- **Founded:** ${agency.founded}
- **Location:** ${agency.location}

---

**👥 Team & Contact**
- **Team Roles:** ${agency.team_roles.join(', ')}
- **Leadership:** 
  - ${companyProfile.leadership.map(leader => `${leader.name} (${leader.role})`).join('\n  - ')}
- **Work Email:** ${agency.contact.work_inquiries.email}
- **Work Phone:** ${agency.contact.work_inquiries.phone}
- **Career Email:** ${agency.contact.career_inquiries.email}
- **Career Phone:** ${agency.contact.career_inquiries.phone}
- **Average Response Time:** ${agency.contact.average_response_time}

---

**📊 Key Stats**
- Industries Served: ${agency.stats.industries_served}
- Clients Served: ${agency.stats.clients_served}
- Projects Completed: ${agency.stats.projects_completed}
- Funding Raised: ${agency.stats.client_funding_raised}
- Retention Ratio: ${agency.stats.retention_ratio}
- Clutch Rating: ${agency.stats.clutch_rating}
- Screens Designed: ${agency.stats.screens_designed}
- Happy Clients: ${agency.stats.happy_clients}

---

**🛠️ Services We Offer**
${services.map(s => `- **${s.category}**: ${s.description}  
   Offerings: ${s.offerings.map(o => o.name).join(', ')}`).join('\n')}

---

**🔗 Social Links**
${agency.social_links.map(link => `- ${link}`).join('\n')}

---

**📦 RESPONSE STRUCTURE & STYLE**
- Always answer using **only** the verified content above
- Keep answers **between 40 and 120 words** unless longer explanation is needed
- Use **bold section headers** and **concise points**
- Format important information with markdown (## for headers, * for lists, **bold** for emphasis)
- Use emojis sparingly to make responses more engaging (🚀, ✅, 💡, etc.)
- Structure complex answers with clear sections and numbered lists
- Highlight key terms like service names, team members, and industry terms
- Never summarize by saying "that's all" or "no more info"
- If a topic isn't listed, respond ONLY with:  
  "I don't have the details on [insert topic] handy right now, but I'd be happy to connect you with our team for more info!"
`;



    try {
      // Prepare the request payload
      const requestPayload = {
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: `You are the official chatbot of CodeTheorem. Speak as "we". Respond using markdown. Do not guess or use forbidden phrases.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 0.9
      };
      
      // Log what's being sent to OpenRouter
      console.log('\n==== SENDING TO OPENROUTER ====');
      console.log('Model:', MODEL_NAME);
      console.log('User Message:', message);
      console.log('System Prompt Length:', systemPrompt.length, 'characters');
      console.log('Temperature:', requestPayload.temperature);
      console.log('Max Tokens:', requestPayload.max_tokens);
      
      // Make API call to OpenRouter
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://codetheorem.com', // Use your actual site
          'X-Title': 'AgencyBot'
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.3,
          max_tokens: 1024
        })
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouter API error:', response.status, errorBody);
        return res.status(response.status).json({
          error: 'OpenRouter API error',
          status: response.status,
          details: errorBody
        });
      }
      const chatCompletion = await response.json();
      
      // Log what's received from OpenRouter
      console.log('\n==== RECEIVED FROM OPENROUTER ====');
      console.log('Response:', chatCompletion.choices?.[0]?.message?.content);
      console.log('Finish Reason:', chatCompletion.choices?.[0]?.finish_reason);
      console.log('Completion Tokens:', chatCompletion.usage?.completion_tokens);
      console.log('Prompt Tokens:', chatCompletion.usage?.prompt_tokens);
      console.log('Total Tokens:', chatCompletion.usage?.total_tokens);
      console.log('============================\n');

      let aiResponse = chatCompletion.choices?.[0]?.message?.content || 'No response from model.';
      
      // Use marked to convert markdown to HTML and sanitize output
      aiResponse = marked.parse(aiResponse, { mangle: false, headerIds: false });
      
      // Apply additional styling to enhance the response appearance
      aiResponse = enhanceResponseStyling(aiResponse);

      // Simple flat list of all possible follow-up questions
      const allPossibleQuestions = [
        // 🎯 Services
        "What services does CodeTheorem provide?",
        "What's included in your design services?",
        "What development services do you offer?",
        "Do you offer mobile app development?",
        "Do you build websites or web platforms?",
        "What types of design systems do you create?",
        "Do you offer UX audits or product redesign?",
        "What are your industry-specific design offerings?",
      
        // 🧠 Process
        "What is your project process?",
        "What are the phases of a typical project?",
        "How do you handle project development?",
        "Do you provide testing and support after launch?",
      
        // 💡 Technologies
        "What technologies do you use for frontend?",
        "What backend technologies do you use?",
        "What tools does your team use for design and collaboration?",
        "What platforms do you support?",
      
        // 👥 Team & Culture
        "Who is the Chief of Development at CodeTheorem?",
        "What roles are on your team?",
        "What is your work culture like?",
        "What are some fun facts about your team?",
        "What’s the BLEMS hiring challenge?",
      
        // 🏆 Industry & Experience
        "What industries do you serve?",
        "Have you worked with SaaS companies?",
        "Do you have experience in healthcare projects?",
        "Have you worked with fintech companies?",
        "Can you share case studies or past projects?",
      
        // 🤝 Engagement & Contact
        "What engagement models do you offer?",
        "How can I start a project with you?",
        "How can I contact CodeTheorem?",
        "What’s your average response time?",
        "Can I schedule a consultation call?",
      
        // 🧾 Recognition & Results
        "Are you a Clutch-rated agency?",
        "What are your key achievements?",
        "How many clients have you worked with?",
        "How many projects have you completed?",
        "How many screens have you designed?"
      ];
      
      // Simple function to shuffle an array
      function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }
      
      // Get a random set of questions
      const shuffledQuestions = shuffleArray([...allPossibleQuestions]);
      const suggestedQuestions = shuffledQuestions.slice(0, 2);

      // Log the suggested follow-up questions
      console.log('\n==== SUGGESTED FOLLOW-UP QUESTIONS ====');
      console.log('Questions:', suggestedQuestions);
      console.log('=======================================\n');

      // Return the response to the client
      return res.json({
        response: aiResponse,
        suggestedQuestions
      });
    } catch (error) {
      // 1. API Authentication Errors
      if (error.message && (error.message.includes('API key') || 
                          error.message.includes('authentication') || 
                          error.message.includes('unauthorized') || 
                          error.status === 401 || 
                          error.statusCode === 401)) {
        return res.status(401).json({
          response: "I'm having trouble connecting to my knowledge base. Please check the API configuration.",
          error: 'API authentication error',
          errorType: 'auth_error',
          suggestedAction: 'Check GROQ_API_KEY in .env file'
        });
      }
      
      // 2. Rate Limiting / Quota Errors
      if (error.message && (error.message.includes('rate limit') || 
                          error.message.includes('quota') || 
                          error.message.includes('too many requests') || 
                          error.status === 429 || 
                          error.statusCode === 429)) {
        return res.status(429).json({
          response: "I've received too many requests right now. Please try again in a moment.",
          error: 'Rate limit exceeded',
          errorType: 'rate_limit',
          retryAfter: error.headers?.['retry-after'] || 60
        });
      }
      
      // 3. Model Errors
      if (error.message && (error.message.includes('model') || 
                          error.message.includes('not found') || 
                          error.status === 404 || 
                          error.statusCode === 404)) {
        return res.status(400).json({
          response: "I'm having trouble processing your request. The AI model may not be available.",
          error: 'Model configuration error',
          errorType: 'model_error',
          suggestedAction: 'Check GROQ_MODEL_NAME in .env file'
        });
      }
      
      // 4. Network Errors
      if (error.code === 'ENOTFOUND' || 
          error.code === 'ETIMEDOUT' || 
          error.code === 'ECONNREFUSED' || 
          error.code === 'ECONNRESET' || 
          error.message?.includes('network') || 
          error.message?.includes('timeout')) {
        return res.status(503).json({
          response: "I'm having trouble connecting to the AI service. Please check your internet connection and try again in a moment.",
          error: 'Network connectivity issue',
          errorType: 'network_error',
          isTemporary: true
        });
      }
      
      // 5. Content Filtering/Moderation Errors
      if (error.message && (error.message.includes('content filter') || 
                          error.message.includes('moderation') || 
                          error.message.includes('inappropriate') || 
                          error.status === 400)) {
        return res.status(400).json({
          response: "I'm unable to process this request due to content restrictions. Please try a different question.",
          error: 'Content policy violation',
          errorType: 'content_filter'
        });
      }
      
      // 6. Parsing Errors (invalid JSON, etc)
      if (error.message && (error.message.includes('parse') || 
                          error.message.includes('JSON') || 
                          error.message.includes('syntax'))) {
        return res.status(500).json({
          response: "I received an unexpected response format. Our team has been notified.",
          error: 'Response parsing error',
          errorType: 'parsing_error'
        });
      }
      
      // 7. Default fallback with graceful degradation
      // Try to provide a helpful response even when errors occur
      return res.status(500).json({
        response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        error: 'An unexpected error occurred',
        errorType: 'general_error',
        isRetryable: true,
        suggestedQuestions: [
          "What services does CodeTheorem offer?",
          "Tell me about your team",
          "How can I contact CodeTheorem?"
        ]
      });
    }
  } catch (error) {
    // Debug: Log error details
    console.error('Error in processMessage:', error);
    // Send a more detailed error response for outer try-catch
    return res.status(500).json({
      error: 'An error occurred while processing your message',
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Enhances the response styling with custom formatting
 * @param {string} htmlResponse - The HTML response from marked
 * @returns {string} - Enhanced HTML response
 */
function enhanceResponseStyling(htmlResponse) {
  if (!htmlResponse) return '';
  
  // Add custom classes to elements
  let enhancedResponse = htmlResponse
    // Style headings with custom classes
    .replace(/<h1>(.*?)<\/h1>/g, '<h1 class="main-title">$1</h1>')
    .replace(/<h2>(.*?)<\/h2>/g, '<h2 class="message-title">$1</h2>')
    .replace(/<h3>(.*?)<\/h3>/g, '<h3 class="message-title">$1</h3>')
    
    // Add icons to common section titles
    .replace(/<h[23]>\s*Services\s*<\/h[23]>/gi, '<h3 class="message-title"><i class="fas fa-cogs"></i> Services</h3>')
    .replace(/<h[23]>\s*About Us\s*<\/h[23]>/gi, '<h3 class="message-title"><i class="fas fa-info-circle"></i> About Us</h3>')
    .replace(/<h[23]>\s*Contact\s*<\/h[23]>/gi, '<h3 class="message-title"><i class="fas fa-envelope"></i> Contact</h3>')
    .replace(/<h[23]>\s*Projects\s*<\/h[23]>/gi, '<h3 class="message-title"><i class="fas fa-project-diagram"></i> Projects</h3>')
    .replace(/<h[23]>\s*Team\s*<\/h[23]>/gi, '<h3 class="message-title"><i class="fas fa-users"></i> Team</h3>')
    .replace(/<h[23]>\s*Technologies\s*<\/h[23]>/gi, '<h3 class="message-title"><i class="fas fa-laptop-code"></i> Technologies</h3>')
    .replace(/<h[23]>\s*Process\s*<\/h[23]>/gi, '<h3 class="message-title"><i class="fas fa-tasks"></i> Process</h3>')
    .replace(/<h[23]>\s*Benefits\s*<\/h[23]>/gi, '<h3 class="message-title"><i class="fas fa-award"></i> Benefits</h3>')
    
    // Style lists with custom classes
    .replace(/<ul>/g, '<ul class="bot-list">')
    .replace(/<ol>/g, '<ol class="bot-numbered-list">')
    .replace(/<li>/g, '<li class="bot-list-item">')
    
    // Highlight company name and important terms
    .replace(/CodeTheorem/g, '<span class="highlight">CodeTheorem</span>')
    .replace(/Code Theorem/g, '<span class="highlight">Code Theorem</span>')
    
    // Format numbered items that aren't in lists
    .replace(/([0-9]+\.)\s+([^<]+)(?!<\/li>)/g, '<div class="numbered-item"><span class="list-number">$1</span><span class="numbered-content">$2</span></div>')
    
    // Format contact information
    .replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '<span class="contact-info">$&</span>')
    .replace(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g, '<a href="mailto:$&" class="contact-link">$&</a>')
    
    // Format service names and categories
    .replace(/UI Design|UX Design|Web Design|Mobile App Design|Design System/g, '<span class="highlight-service">$&</span>')
    .replace(/Website Development|Front-End Development|Back-End Development|Mobile App Development|Webflow Development|WordPress Development|Full Stack Development/g, '<span class="highlight-service">$&</span>')
    
    // Format industry terms
    .replace(/SaaS|Healthcare|EdTech|E-commerce|Enterprise|Fintech/g, '<span class="highlight-project">$&</span>')
    
    // Format team member names with roles
    .replace(/Rajdip Khavad\s*\(.*?\)|Vraj Trivedi\s*\(.*?\)|Prem Parmar\s*\(.*?\)/g, '<span class="highlight-person">$&</span>')
    .replace(/Rajdip Khavad|Vraj Trivedi|Prem Parmar/g, '<span class="highlight-person">$&</span>')
    
    // Add spacing after titles
    .replace(/<\/h3>/g, '</h3><div class="title-separator"></div>');
  
  // Add section breaks between major sections
  enhancedResponse = enhancedResponse.replace(/<\/h3><div class="title-separator"><\/div>/g, '</h3><div class="title-separator"></div><div class="section-break"></div>');
  
  return enhancedResponse;
}

module.exports = {
  processMessage
};
