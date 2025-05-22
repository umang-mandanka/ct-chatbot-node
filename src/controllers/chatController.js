const companyProfile = require('../data/agencyData');
const { OpenAI } = require('openai');

// Initialize OpenAI client with Groq API key and base URL
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1', // Use Groq's API endpoint
  });
  console.log('OpenAI client initialized successfully with Groq API');
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error.message);
}

// Check if API key is set
if (!process.env.GROQ_API_KEY) {
  console.warn('WARNING: GROQ_API_KEY environment variable is not set. API calls will fail.');
}

/**
 * Process a chat message and get a response from the AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processMessage = async (req, res) => {
  try {
    console.log('Received message request:', req.body);
    const { message } = req.body;
    
    // Log the full structure of the company profile for debugging
    console.log('Full company profile structure:', JSON.stringify(Object.keys(companyProfile), null, 2));
    
    if (!message) {
      console.log('Message is required but was not provided');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create a system prompt that includes the company profile data
    const systemPrompt = `You are the official, friendly, and professional chatbot for ${companyProfile.companyOverview.name} Follow these instructions exactly and without exception. 
      GENERAL BEHAVIOR GUIDELINES

Speak on behalf of CodeTheorem
- Always use "we" to refer to the company, never “they” or “the company.”

Stay focused and factual
- Only share clear, direct insights related to CodeTheorem’s actual work and capabilities.

Be confident and conversational
- Responses should sound helpful, human, and professional — never robotic or uncertain.

Keep replies concise and structured
- Use numbered or bulleted lists, bold headings, and minimal fluff.

NEVER speculate or generalize
- Do not guess, assume, or use generic/industry examples.
- Only share specific, known CodeTheorem facts.

FORBIDDEN PHRASES — DO NOT USE EVER
You must NEVER use or reference the following words or phrases in any form:
- “data”
- “information”
- “mentioned”
- “provided”
- “according to the provided…”
- “based on the provided…”
- “unfortunately…”
- “No further information available.”
- “No more information.”
- “No additional information.”
- ANY variation of these

⚠️ ABSOLUTELY DO NOT SAY:
- “The provided data does not mention...”
- “Unfortunately, we don't have information on...”
- “According to the case study…”
- “Based on the information provided…”
- “The data shows…”
- “We recommend checking external resources…”

IF ASKED ABOUT UNKNOWN TOPIC:
If you’re asked about anything not clearly defined, respond with ONLY the following:

“I don't have the details on [insert topic] handy right now, but I'd be happy to connect you with our team for more info!”

⚠️ Do NOT add anything before or after. Do NOT elaborate or suggest alternatives. This is the ONLY permitted response.

IF THERE IS SOME INFORMATION:
If there is any information available about the topic, provide ONLY that information—do not add "No further information available", "No more information", "No additional information", or similar. Simply provide the available details and stop. Never state or imply that information is missing or limited—just answer with what you know.

HARD RESTRICTIONS
- NEVER reference “data,” “information,” or what is/isn’t “provided.”
- NEVER recommend external resources (blogs, guides, case studies, FAQs, industry best practices, etc.).
- NEVER create or suggest example content (emails, templates, steps, scenarios, or approaches).
- NEVER list tools, strategies, or processes not already explicitly confirmed as used by CodeTheorem.
- NEVER include closing lines like “What else would you like to know?”
- NEVER use JSON or suggest sample questions — even if requested.
- NEVER generate generic advice.

FORMATTING & STYLE RULES
1. **Use clear section titles**
2. **Use numbered or bulleted lists for details**
3. **Bold key phrases for emphasis**
4. **Keep content concise and confident**
5. **Use a friendly, conversational tone**

    
    Company Name: ${companyProfile.companyOverview.name}
    Founded: ${companyProfile.companyOverview.founded}
    Description: ${companyProfile.companyOverview.description}
    Mission: ${companyProfile.companyOverview.mission}
    Location: ${companyProfile.companyOverview.location}
    
    Services:
    Design: ${companyProfile.services.design.join(', ')}
    Development: ${companyProfile.services.development.join(', ')}
    Solutions: ${companyProfile.services.solutions.join(', ')}
    
    Industries Served:
    ${companyProfile.industriesServed.map(industry => 
      `- ${industry.name}: ${industry.description}`
    ).join('\n')}
    
    Leadership Team:
    ${companyProfile.leadership.map(leader => 
      `- ${leader.name}, ${leader.role}`
    ).join('\n')}
    
    Case Studies:
    ${companyProfile.caseStudies.map(study => 
      `- ${study.title} (${study.industry}): ${study.description}`
    ).join('\n')}
    
    Contact Information:
    Work Inquiries: ${companyProfile.contactDetails.workInquiries.email}, ${companyProfile.contactDetails.workInquiries.phone}
    Career Inquiries: ${companyProfile.contactDetails.careerInquiries.email}, ${companyProfile.contactDetails.careerInquiries.phone}
    Response Time: ${companyProfile.contactDetails.averageResponseTime}
    
    Blog Posts:
    ${companyProfile.blogPosts.map(blog => 
      `- "${blog.title}" (${blog.category}) - Published on ${blog.date}`
    ).join('\n')}
    
    FAQs:
    ${companyProfile.faqs.map(faq => 
      `Q: ${faq.question}
       A: ${faq.answer}`
    ).join('\n')}
    
    Client Testimonials:
    ${companyProfile.clientTestimonials.map(testimonial => 
      `- ${testimonial.client} (${testimonial.company}): "${testimonial.quote}"`
    ).join('\n')}
    
    Company Culture:
    ${companyProfile.additionalSections.Culture.map(item => `- ${item}`).join('\n')}
    
    About Us: ${companyProfile.additionalSections.AboutUs}
    
    Technology Stack:
    Front-End: ${companyProfile.technologyStack?.frontEndTechnologies?.join(', ') || 'Not specified'}
    Back-End: ${companyProfile.technologyStack?.backEndTechnologies?.join(', ') || 'Not specified'}
    Design Tools: ${companyProfile.technologyStack?.designTools?.join(', ') || 'Not specified'}
    
   
  
    
   
     
     ` // End of prompt
     ;

    // Use OpenAI/Groq API to generate a response
    
    
    try {
      // Make API call to Groq via OpenAI compatible interface
      const chatCompletion = await openai.chat.completions.create({
        model: 'llama3-8b-8192', // Using Llama 3 8B model which is supported by Groq
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
      
      
      // Remove any "Suggested Questions" section from the response if present
      // Use multiple patterns to catch different formats
      aiResponse = aiResponse.replace(/Suggested Questions[\s\S]*?\[.*?\]/gi, '').trim();
      aiResponse = aiResponse.replace(/Suggested Questions[\s\S]*$/i, '').trim();
      aiResponse = aiResponse.replace(/\[".*?"(,\s*".*?")*\]\s*$/i, '').trim();
      
      // Remove any trailing colons, dashes, or other punctuation that might be left
      aiResponse = aiResponse.replace(/[:\-–—]\s*$/g, '').trim();
      

      // Static question pool provided by the user
      const questionPool = [
        "Who is the Chief of Development at Code Theorem?",
        "What services does Code Theorem provide?",
        "What solutions does Code Theorem offer?",
        "What technologies does Code Theorem use?",
        "What engagement models does Code Theorem offer?",
        "What are some cultural traits of Code Theorem?",
        "What tools does Code Theorem use?",
        "What is Code Theorem’s development process?",
        "What types of mobile apps does Code Theorem develop?",
        "Why should I choose Code Theorem over freelancers?",
        "What industries does Code Theorem serve?",
        "What does Code Theorem do?",
        "What blog posts has Code Theorem published?",
        "Is Code Theorem a verified Clutch partner?",
        "What case studies has Code Theorem published?",
        "What is the case study for “Intromagic”?",
        "What is the case study for “Emroll CRM”?",
        "What is the case study for “Resume Pro”?",
        "What is the case study for “Ezycheck App”?",
        "What testimonials has Code Theorem received?",
        "What did Intromagic say about Code Theorem?",
        "What did their international client say about Code Theorem?",
        "What industries does Code Theorem work with?",
        "Does Code Theorem work with SaaS companies?",
        "Does Code Theorem work in the EdTech industry?",
        "Does Code Theorem provide services for eCommerce?",
        "Is healthcare one of the industries Code Theorem works with?"
      ];

      // Shuffle function (Fisher-Yates)
      function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
          [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
      }

      // Track which questions have been used
      if (!global._usedQuestions || global._usedQuestions.length >= questionPool.length) {
        global._usedQuestions = [];
      }
      const unused = questionPool.filter(q => !global._usedQuestions.includes(q));
      const shuffled = shuffle([...unused]);
      const numToShow = Math.floor(Math.random() * 2) + 3; // 3 or 4
      const suggestedQuestions = shuffled.slice(0, numToShow);
      global._usedQuestions.push(...suggestedQuestions);

      return res.json({
        response: aiResponse,
        suggestedQuestions: suggestedQuestions
      });
    } catch (error) {
      
      
      
      // Check if it's an API key error
      if (error.message.includes('API key')) {
        return res.status(401).json({
          response: "I'm having trouble connecting to my knowledge base. Please check if the API key is correctly set in the .env file.",
          error: 'API key error',
          details: error.message
        });
      }
      
      // Check if it's a model error
      if (error.message.includes('model')) {
        return res.status(400).json({
          response: "I'm having trouble processing your request. The AI model specified may not be available.",
          error: 'Model error',
          details: error.message
        });
      }
      
      return res.status(500).json({
        response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        error: 'An error occurred while calling the Groq API',
        details: error.message
      });
    }
  } catch (error) {
    
    
    
    
    // Send a more detailed error response
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
