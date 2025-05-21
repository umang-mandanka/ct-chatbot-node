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
    const systemPrompt = `You are a helpful AI assistant for ${companyProfile.companyOverview.name}. 

     STRICT CONTENT RULES:
    1. NEVER generate example emails, templates, or hypothetical scenarios
    2. NEVER suggest steps or approaches that aren't explicitly mentioned in the data
    3. NEVER create sample messages or outreach templates
    4. NEVER provide advice beyond what's directly stated in the data
    5. If asked how to approach or contact the agency, ONLY provide the contact information listed above
    6. NEVER create or suggest content that isn't directly from the provided data
    
      FORMATTING INSTRUCTIONS:
    1. Always structure your response with clear section titles
    2. Use numbered lists (1, 2, 3) for any list items
    3. Put section titles on their own line
    4. Keep responses concise and directly related to the user's query
    5. Only respond with information contained in the data provided above
    6. Do not make up or invent information not included in this data
    7. If asked about something not in the data, politely explain you don't have that information
    

    Use ONLY the following information about the company to answer user questions accurately:
    
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
    
   
  
    
        IMPORTANT INSTRUCTIONS:
     1. Your responses must be 100% based on the provided data. If you don't have specific information about something, simply state that you don't have that information.
     2. NEVER include suggested questions, follow-up questions, or question lists in your response.
     3. NEVER include JSON arrays in your response.
     4. NEVER end your response with phrases like "Suggested Questions" or similar.
     5. Keep your answers focused only on addressing the user's query directly.
     6. Do not add any kind of "What else would you like to know?" or similar prompts at the end.
     
     ` // End of prompt
     ;

    // Use OpenAI/Groq API to generate a response
    console.log('Sending request to Groq API for message:', message);
    
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
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3, // Lower temperature for more deterministic responses
        max_tokens: 1024,
        top_p: 0.9
      });
      
      console.log('Received response from Groq API');
      let aiResponse = chatCompletion.choices[0].message.content;
      console.log('Generated response (raw):', aiResponse);
      
      // Remove any "Suggested Questions" section from the response if present
      // Use multiple patterns to catch different formats
      aiResponse = aiResponse.replace(/Suggested Questions[\s\S]*?\[.*?\]/gi, '').trim();
      aiResponse = aiResponse.replace(/Suggested Questions[\s\S]*$/i, '').trim();
      aiResponse = aiResponse.replace(/\[".*?"(,\s*".*?")*\]\s*$/i, '').trim();
      
      // Remove any trailing colons, dashes, or other punctuation that might be left
      aiResponse = aiResponse.replace(/[:\-–—]\s*$/g, '').trim();
      console.log('Cleaned response:', aiResponse);

      // Dynamically generate suggested questions using Groq/Llama3
      const generateQuestions = async () => {
        try {
          // Make a dedicated call to generate contextually relevant follow-up questions
          const questionCompletion = await openai.chat.completions.create({
            model: 'llama3-8b-8192',
            messages: [
              {
                role: 'system',
                content: `SYSTEM: You are a question generator for a chatbot interface. Your ONLY task is to generate 4 relevant follow-up questions based on the conversation context.

CRITICAL INSTRUCTIONS:
1. Your response must be ONLY a valid JSON array of strings containing questions.
2. Do not include ANY explanation, markdown formatting, or additional text.
3. Do not use backticks, do not label it as JSON, just return the raw array.
4. These questions will be shown in a separate UI element, not in the main chat.
5. Keep questions concise (under 60 characters if possible).

Example of correct format: ["What services do you offer?", "How can I contact you?", "Tell me about your team", "What industries do you serve?"]

Any text outside of a valid JSON array will cause errors.`
              },
              {
                role: 'user',
                content: `The user asked: "${message}"

The assistant responded with information about: "${aiResponse.substring(0, 200)}..."

Generate 4 relevant follow-up questions that would be natural for the user to ask next.`
              }
            ],
            temperature: 0.7,
            max_tokens: 256
          });
          
          const rawQuestions = questionCompletion.choices[0].message.content.trim();
          console.log('Raw generated questions:', rawQuestions);
          
          // Handle different response formats
          let jsonStr = rawQuestions;
          
          // Remove any backticks if present (code blocks)
          if (rawQuestions.includes('```')) {
            jsonStr = rawQuestions.replace(/```json\n|```\n|```json|```/g, '');
          }
          
          // Extract just the array if there's explanatory text
          const arrayMatch = jsonStr.match(/\[(\s*"[^"]*"\s*,?\s*)+\]/s);
          if (arrayMatch) {
            jsonStr = arrayMatch[0];
          }
          
          // Parse the JSON and validate it's an array of strings
          const parsedQuestions = JSON.parse(jsonStr);
          console.log('Parsed questions:', parsedQuestions);
          
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            return parsedQuestions;
          } else {
            console.error('Generated questions are not in the expected format');
            return [
              "What services do you offer?",
              "Tell me about your case studies",
              "How can I contact you?",
              "Who is on your leadership team?"
            ];
          }
        } catch (e) {
          console.error('Error generating questions:', e, e.stack);
          // Return default questions as fallback
          return [
            "What services do you offer?",
            "Tell me about your case studies",
            "How can I contact you?",
            "Who is on your leadership team?"
          ];
        }
      };
      
      // Generate dynamic questions based on the conversation
      try {
        const suggestedQuestions = await generateQuestions();
        console.log('Final suggested questions to send:', suggestedQuestions);
        
        return res.json({
          response: aiResponse,
          suggestedQuestions: suggestedQuestions
        });
      } catch (error) {
        console.error('Error in final question generation:', error);
        // Provide fallback questions if there's an error
        return res.json({
          response: aiResponse,
          suggestedQuestions: [
            "What services do you offer?",
            "Tell me about your case studies",
            "How can I contact you?",
            "Who is on your leadership team?"
          ]
        });
      }
    } catch (error) {
      console.error('Error calling Groq API:', error);
      console.error('Error details:', error.message);
      
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
    console.error('Error processing message:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', req.body);
    
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
