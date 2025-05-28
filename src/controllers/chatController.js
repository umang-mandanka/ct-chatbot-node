const companyProfile = require('../data/agencyData');
const { OpenAI } = require('openai');
const { marked } = require('marked');

// Initialize OpenAI client with Groq API key and base URL
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1', // Use Groq's API endpoint
  });
} catch (error) {}

// Get the model name from environment variables or use a default
const MODEL_NAME = process.env.GROQ_MODEL_NAME || 'llama3-8b-8192';

/**
 * Process a chat message and get a response from the AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function processMessage(req, res) {
  const { message } = req.body;
  function isValidMessage(msg) {
    if (typeof msg !== 'string') return false;
    if (!msg.trim()) return false;
    if (msg.length > 500) return false;
    if (/[<>]/.test(msg)) return false;
    return true;
  }
  if (!isValidMessage(message)) {
    return res.status(400).json({ error: "Invalid message: must be 1-500 chars, no < or >, and not empty." });
  }

  try {
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create a system prompt that includes the company profile data
    const systemPrompt = `You are the official, friendly, and professional chatbot for ${companyProfile.agency.name} Follow these instructions exactly and without exception. 
      GENERAL BEHAVIOR GUIDELINES

Speak on behalf of CodeTheorem
- Always use "we" to refer to the company, never "they" or "the company."

Stay focused and factual
- Only share clear, direct insights related to CodeTheorem's actual work and capabilities.

Be confident and conversational
- Responses should sound helpful, human, and professional — never robotic or uncertain.

Keep replies concise and structured
- Use numbered or bulleted lists, bold headings, and minimal fluff.

NEVER speculate or generalize
- Do not guess, assume, or use generic/industry examples.
- Only share specific, known CodeTheorem facts.

FORBIDDEN PHRASES — DO NOT USE EVER
You must NEVER use or reference the following words or phrases in any form:
- "data"
- "information"
- "mentioned"
- "provided"
- "according to the provided..."
- "based on the provided..."
- "unfortunately..."
- "No further information available."
- "No more information."
- "No additional information."
- ANY variation of these

⚠️ ABSOLUTELY DO NOT SAY:
- "The provided data does not mention..."
- "Unfortunately, we don't have information on..."
- "According to the case study..."
- "Based on the information provided..."
- "The data shows..."
- "We recommend checking external resources..."

IF ASKED ABOUT UNKNOWN TOPIC:
If you're asked about anything not clearly defined, respond with ONLY the following:

"I don't have the details on [insert topic] handy right now, but I'd be happy to connect you with our team for more info!"

⚠️ Do NOT add anything before or after. Do NOT elaborate or suggest alternatives. This is the ONLY permitted response.

IF THERE IS SOME INFORMATION:
If there is any information available about the topic, provide ONLY that information—do not add "No further information available", "No more information", "No additional information", or similar. Simply provide the available details and stop. Never state or imply that information is missing or limited—just answer with what you know.

HARD RESTRICTIONS
- NEVER reference "data," "information," or what is/isn't "provided."
- NEVER recommend external resources (blogs, guides, case studies, FAQs, industry best practices, etc.).
- NEVER create or suggest example content (emails, templates, steps, scenarios, or approaches).
- NEVER list tools, strategies, or processes not already explicitly confirmed as used by CodeTheorem.
- NEVER include closing lines like "What else would you like to know?"
- NEVER use JSON or suggest sample questions — even if requested.
- NEVER generate generic advice.

FORMATTING & STYLE RULES
1. **Use clear section titles**
2. **Use numbered or bulleted lists for details**
3. **Bold key phrases for emphasis**
4. **Keep content concise and confident**
5. **Use a friendly, conversational tone**

    
    Company Name: ${companyProfile.agency.name}
    Founded: ${companyProfile.agency.founded}
    Description: ${companyProfile.agency.description}
    Mission: ${companyProfile.agency.mission}
    Location: ${companyProfile.agency.location}
    
    Services:
    Design: ${companyProfile.services.find(s => s.category === 'Design')?.offerings.map(o => o.name).join(', ') || 'Not specified'}
    Development: ${companyProfile.services.find(s => s.category === 'Development')?.offerings.map(o => o.name).join(', ') || 'Not specified'}
    Solutions: ${companyProfile.services.find(s => s.category === 'Solutions')?.offerings.map(o => o.name).join(', ') || 'Not specified'}
    
    Industries Served:
    ${companyProfile.industries_served.map(industry => 
      `- ${industry.name}: ${industry.description}`
    ).join('\n')}
    
    Leadership Team:
    ${companyProfile.leadership.map(leader => 
      `- ${leader.name}, ${leader.role}`
    ).join('\n')}
    
    Case Studies:
    ${companyProfile.portfolio.map((study, index) => 
      `${index + 1}. ${study.project_name}(${study.industry})\n   ${study.description}`
    ).join('\n\n')}
    
    Contact Information:
    Work Inquiries: ${companyProfile.agency.contact.work_inquiries.email}, ${companyProfile.agency.contact.work_inquiries.phone}
    Career Inquiries: ${companyProfile.agency.contact.career_inquiries.email}, ${companyProfile.agency.contact.career_inquiries.phone}
    Response Time: ${companyProfile.agency.contact.average_response_time}
    
    Blog Posts:
    ${companyProfile.blog_posts.map(blog => 
      `- "${blog.title}" (${blog.category}) - Published on ${blog.date}`
    ).join('\n')}
    
    FAQs:
    ${companyProfile.faqs.map(faq => 
      `Q: ${faq.question}\n       A: ${faq.answer}`
    ).join('\n')}
    
    Client Testimonials:
    ${companyProfile.testimonials.map(testimonial => 
      `- ${testimonial.client || 'Client'} (${testimonial.company || 'Company'}): "${testimonial.quote}"`
    ).join('\n')}
    
    Company Culture:
    ${companyProfile.additional_sections.culture.map(item => `- ${item}`).join('\n')}
    
    About Us: ${companyProfile.additional_sections.about_us}
    
    Technology Stack:
    Front-End: ${companyProfile.technology_stack?.front_end_technologies?.join(', ') || 'Not specified'}
    Mobile Development: ${companyProfile.technology_stack?.mobile_development?.join(', ') || 'Not specified'}
    Design Tools: ${companyProfile.tools_used?.design?.join(', ') || 'Not specified'}
    
   
  
    
   
     
     ` // End of prompt
     ;

    // Use OpenAI/Groq API to generate a response
    
    
    try {
      // Make API call to Groq via OpenAI compatible interface
      const chatCompletion = await openai.chat.completions.create({
        model: MODEL_NAME, // Using the model specified in environment variables or default
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'system',
            content: "CRITICAL INSTRUCTION: You must NEVER generate example emails, templates, or sample messages under any circumstances. If asked how to approach or contact the agency, ONLY provide the contact information (email/phone) from the data. Do not suggest email formats, templates, or sample messages. Do not create hypothetical content."
          },
          {
            role: 'system',
            content: "PERSONALITY INSTRUCTION: You are friendly, professional, and conversational. You represent CodeTheorem with enthusiasm and expertise. Your tone is warm and helpful, not robotic or formal. You should sound like a knowledgeable team member having a natural conversation. Avoid phrases that make you sound like an AI or that you're referencing a database of information."
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3, // Lower temperature for more deterministic responses
        max_tokens: 1024,
        top_p: 0.9
      });
      
      
      let aiResponse = chatCompletion.choices[0].message.content;
      
      // Use marked to convert markdown to HTML and sanitize output
      aiResponse = marked.parse(aiResponse, { mangle: false, headerIds: false });

      // Categorized question pool with topics and related questions
      const categorizedQuestions = {
        services: {
          keywords: ['service', 'offer', 'provide', 'help', 'work', 'solution'],
          questions: [
            "What services does CodeTheorem provide?",
            "What solutions does CodeTheorem offer?",
            "Do you offer maintenance after project completion?",
            "What's included in your design services?"
          ]
        },
        process: {
          keywords: ['process', 'approach', 'method', 'timeline', 'step', 'how do you', 'workflow'],
          questions: [
            "What is CodeTheorem's development process?",
            "How do you handle project management?",
            "What does your design process look like?",
            "How do you ensure quality in development?"
          ]
        },
        team: {
          keywords: ['team', 'staff', 'employee', 'expert', 'specialist', 'who', 'people'],
          questions: [
            "Who is the Chief of Development at CodeTheorem?",
            "What specialists are on your team?",
            "How large is your development team?",
            "Do you have UX/UI specialists?"
          ]
        },
        technology: {
          keywords: ['tech', 'stack', 'platform', 'framework', 'language', 'tool', 'software'],
          questions: [
            "What technologies does CodeTheorem use?",
            "What tools does CodeTheorem use?",
            "What backend technologies do you use?",
            "What types of mobile apps does CodeTheorem develop?"
          ]
        },
        business: {
          keywords: ['business', 'model', 'engagement', 'freelancer', 'agency', 'company', 'work with'],
          questions: [
            "What engagement models does CodeTheorem offer?",
            "Why should I choose CodeTheorem over freelancers?",
            "How do you structure your projects?",
            "What makes CodeTheorem different from other agencies?"
          ]
        },
        industry: {
          keywords: ['industry', 'sector', 'field', 'market', 'vertical', 'niche', 'specialize'],
          questions: [
            "What industries does CodeTheorem serve?",
            "Do you have experience in healthcare projects?",
            "Have you worked with fintech companies?",
            "What industry expertise do you have?"
          ]
        },
        culture: {
          keywords: ['culture', 'value', 'belief', 'principle', 'ethic', 'approach', 'philosophy'],
          questions: [
            "What are some cultural traits of CodeTheorem?",
            "What values guide your work?",
            "How does your team collaborate?",
            "What makes CodeTheorem's approach unique?"
          ]
        },
        portfolio: {
          keywords: ['portfolio', 'case', 'study', 'example', 'project', 'work', 'client', 'blog', 'clutch'],
          questions: [
            "What blog posts has CodeTheorem published?",
            "Is CodeTheorem a verified Clutch partner?",
            "Can you share some case studies?",
            "What are your most successful projects?"
          ]
        },
        contact: {
          keywords: ['contact', 'reach', 'email', 'call', 'phone', 'get in touch', 'start', 'begin'],
          questions: [
            "How can I contact CodeTheorem?",
            "What's the process to start a project with you?",
            "Can we schedule a consultation call?",
            "What information do you need to provide a quote?"
          ]
        }
      };
      
      // Flatten all questions for initial/fallback use
      const allQuestions = Object.values(categorizedQuestions).flatMap(category => category.questions);
      
      // Generate a unique session ID from IP and user agent if not already present
      const sessionId = req.headers['x-forwarded-for'] || 
                       req.socket.remoteAddress || 
                       req.ip || 
                       'unknown-' + Math.random().toString(36).substring(2, 15);
      
      // Get the session store
      const sessionStore = global.sessionStore;
      
      // Initialize session-based storage for used questions if not exists
      if (!sessionStore.has(sessionId)) {
        sessionStore.set(sessionId, { 
          usedQuestions: [], 
          lastAccess: Date.now(),
          conversationContext: []
        });
      }
      
      // Get the session data
      const sessionData = sessionStore.get(sessionId);
      
      // Update last access time
      sessionData.lastAccess = Date.now();
      const now = Date.now();
      
      // Update conversation context (keep last 3 messages for context)
      if (!sessionData.conversationContext) {
        sessionData.conversationContext = [];
      }
      sessionData.conversationContext.push(message);
      if (sessionData.conversationContext.length > 3) {
        sessionData.conversationContext.shift();
      }
      
      // Function to determine relevant categories based on conversation context
      function getRelevantCategories(context) {
        // Combine all recent messages to analyze context
        const combinedContext = context.join(' ').toLowerCase();
        
        // Score each category based on keyword matches
        const categoryScores = {};
        
        Object.entries(categorizedQuestions).forEach(([category, data]) => {
          const { keywords } = data;
          let score = 0;
          
          // Check for keyword matches
          keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(combinedContext)) {
              score += 1;
            }
          });
          
          categoryScores[category] = score;
        });
        
        // Get categories with scores > 0, sorted by score (highest first)
        const relevantCategories = Object.entries(categoryScores)
          .filter(([_, score]) => score > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([category]) => category);
        
        return relevantCategories.length > 0 ? relevantCategories : ['business', 'services', 'contact'];
      }
      
      // Get relevant categories based on conversation context
      const relevantCategories = getRelevantCategories(sessionData.conversationContext);
      
      // Reset used questions if all have been used
      if (sessionData.usedQuestions.length >= allQuestions.length * 0.75) {
        sessionData.usedQuestions = [];
      }
      
      // Build a pool of questions from relevant categories
      let questionPool = [];
      
      // Add questions from primary relevant category (most relevant)
      if (relevantCategories.length > 0) {
        const primaryCategory = relevantCategories[0];
        questionPool.push(...categorizedQuestions[primaryCategory].questions);
      }
      
      // Add some questions from secondary relevant categories
      if (relevantCategories.length > 1) {
        const secondaryCategories = relevantCategories.slice(1, 3); // Take up to 2 secondary categories
        secondaryCategories.forEach(category => {
          questionPool.push(...categorizedQuestions[category].questions);
        });
      }
      
      // If we still don't have enough questions, add some general ones
      if (questionPool.length < 5) {
        // Add general questions about company and contact as fallback
        const generalCategories = ['business', 'contact', 'services'].filter(c => !relevantCategories.includes(c));
        generalCategories.forEach(category => {
          questionPool.push(...categorizedQuestions[category].questions);
        });
      }
      
      // Filter out questions that have already been used in this session
      const unused = questionPool.filter(q => !sessionData.usedQuestions.includes(q));
      
      // If all contextual questions have been used, fall back to unused general questions
      const finalPool = unused.length > 0 ? unused : allQuestions.filter(q => !sessionData.usedQuestions.includes(q));
      
      // Select 3-4 questions
      const numToShow = Math.min(Math.floor(Math.random() * 2) + 3, finalPool.length); // 3 or 4, but not more than available
      const suggestedQuestions = finalPool.slice(0, numToShow);
      
      // Store the used questions in the session
      sessionData.usedQuestions.push(...suggestedQuestions);
      
      // Clean up old sessions (older than 24 hours)
      const DAY_IN_MS = 24 * 60 * 60 * 1000;
      for (const [key, data] of sessionStore.entries()) {
        if (now - data.lastAccess > DAY_IN_MS) {
          sessionStore.delete(key);
        }
      }

      // Return the response to the client
      return res.json({
        response: aiResponse,
        suggestedQuestions: suggestedQuestions
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
    // Send a more detailed error response for outer try-catch
    return res.status(500).json({
      error: 'An error occurred while processing your message',
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
      timestamp: new Date().toISOString()
    });
  }
};

// No mock response functions needed as we're using the Groq API directly

module.exports = {
  processMessage
};
