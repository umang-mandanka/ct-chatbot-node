// Utility to tell parent to resize iframe using state-based protocol
function resizeIframeState(state, transitionDuration = 400) {
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'chatbot-resize',
            state: state,
            transitionDuration: transitionDuration
        }, '*');
    }
}



// Global state variables
let isChatVisible = false;
let isMaximized = false;
let chatOpened = false;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    const chatbox = document.getElementById('chatbox');
    const chatToggle = document.getElementById('chat-toggle');
    const closeChat = document.getElementById('close-chat');
    const maximizeChat = document.getElementById('maximize-chat');
    const refreshChat = document.getElementById('refresh-chat');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const welcomeTimestamp = document.getElementById('welcome-timestamp');
    const typingStatus = document.querySelector('.typing-status');
    const fab = document.querySelector('#chat-toggle i'); // Moved fab declaration here to avoid redeclaration
    const chatForm = document.getElementById('chat-form');
    
    // Add welcome message on page load
    addWelcomeMessage();
    
    // Function to add welcome message and default suggested questions (chips)
    function addWelcomeMessage() {
        // Add welcome message
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
        
        const botAvatar = document.createElement('img');
        botAvatar.src = './images/Logo-1.png';
        botAvatar.alt = 'Bot';
        botAvatar.className = 'h-8 w-8 rounded-full bg-[#1350ff]';
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'bot-message max-w-[80%]';
        
        const messageContent = document.createElement('div');
        messageContent.innerHTML = 'Welcome to <span class="highlight">Code Theorem</span>! How can I assist you today?';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'text-xs text-gray-400 mt-1';
        timestamp.textContent = getCurrentTime();
        
        messageContainer.appendChild(messageContent);
        messageContainer.appendChild(timestamp);
        
        welcomeDiv.appendChild(botAvatar);
        welcomeDiv.appendChild(messageContainer);
        chatMessages.appendChild(welcomeDiv);

        // Add default suggested questions only if not present
        renderQuestionChips([
            "What services do you offer?",
            "Tell me about your case studies",
            "How can I contact you?"
        ]);
    }

    // Utility function to truncate text for chips
    function truncateText(text, maxLength = 25) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Function to render question chips (removes any previous chips)
    function renderQuestionChips(chipsArray) {
        // Remove any existing chips
        const existingChips = chatMessages.querySelector('.suggested-questions');
        if (existingChips) {
            existingChips.remove();
        }
        // Don't render if no questions
        if (!chipsArray || !chipsArray.length) {
            return;
        }
        // Create container for suggested questions
        const suggestedQuestionsDiv = document.createElement('div');
        // Align chips to the left and allow multiple
        suggestedQuestionsDiv.className = 'suggested-questions flex justify-start my-4';
        // Show up to 3 chips
        const chipsToShow = chipsArray.slice(0, 3);
        chipsToShow.forEach((question) => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.setAttribute('data-question', question);
            chip.textContent = truncateText(question, 40); // allow a bit longer for single chip
            chip.title = question;
            chip.addEventListener('click', function() {
                userInput.value = question;
                chatForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            });
            
            suggestedQuestionsDiv.appendChild(chip);
        });
        
        // Add to chat
        chatMessages.appendChild(suggestedQuestionsDiv);
        
        // Scroll to make sure chips are visible
        setTimeout(scrollToBottom, 100);
    }
    
    // Initialize chat container and visibility state - using global state variables
    
    // Open chat function
    function openChat() {
        //('Opening chat...');
        chatbox.classList.remove('hidden');
        isChatVisible = true;
        fab.className = 'fas fa-times';
        resizeIframeState('open');
        // We don't need to show welcome message on open anymore
        // as it's already added on page load
        if (!chatOpened) {
            chatOpened = true;
        }
        // Focus input field after animation completes
        setTimeout(() => {
            if (userInput) userInput.focus();
        }, 400);
    }
    
    // Close chat function
    function closeChatWindow() {
        //('Closing chat...');
        chatbox.classList.add('hidden');
        isChatVisible = false;
        fab.className = 'fas fa-comment-dots text-2xl';
        // Use a slightly longer transition for smooth shrink
        resizeIframeState('minimized', 500); // Use new protocol with custom duration
    }
    
    // Toggle chat visibility
    if (chatToggle && chatbox) {
        chatToggle.addEventListener('click', () => {
            // If maximized, return to normal state first
            if (isMaximized) {
                chatbox.classList.remove('maximized');
                isMaximized = false;
                maximizeChat.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
            }
            
            if (chatbox.classList.contains('hidden')) {
                openChat();
            } else {
                closeChatWindow();
            }
        });
        
        // Add keyboard accessibility
        chatToggle.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (isMaximized) {
                    chatbox.classList.remove('maximized');
                    isMaximized = false;
                    maximizeChat.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
                }
                if (chatbox.classList.contains('hidden')) {
                    openChat();
                } else {
                    closeChatWindow();
                }
            }
        });
    }
    
    // Close chat button event
    if (closeChat && chatbox) {
        closeChat.addEventListener('click', () => {
            closeChatWindow();
        });
    }
    
    // Maximize chat
    if (maximizeChat && chatbox) {
        maximizeChat.addEventListener('click', () => {
            // Add transitioning class to prevent flickering
            chatbox.classList.add('transitioning');
            
            // Force a reflow to ensure the class is applied
            void chatbox.offsetWidth;
            
            // Toggle maximized state
            chatbox.classList.toggle('maximized');
            isMaximized = chatbox.classList.contains('maximized');
            
            // Update the maximize button icon
            maximizeChat.innerHTML = isMaximized
                ? '<i class="fas fa-compress-arrows-alt"></i>'
                : '<i class="fas fa-expand-arrows-alt"></i>';
            
            // Resize iframe with small delay
            setTimeout(() => {
                if (isMaximized) {
                    resizeIframeState('maximized');
                } else {
                    resizeIframeState('open');
                }
            }, 50);
            
            // Remove transitioning class after animation completes
            setTimeout(() => {
                chatbox.classList.remove('transitioning');
                if (userInput) userInput.focus();
            }, 400); // Match CSS transition duration
        });
    }
      
    
    // Refresh chat functionality
    if (refreshChat && chatMessages) {
        refreshChat.addEventListener('click', () => {
            // Add rotation animation to the refresh icon
            refreshChat.querySelector('i').classList.add('fa-spin');
            
            // Clear all messages
            chatMessages.innerHTML = '';
            
            // Add welcome message and suggested questions back using the existing function
            addWelcomeMessage();
            
            // Show a notification that chat has been restarted
            const notificationDiv = document.createElement('div');
            notificationDiv.className = 'text-center py-2 text-xs text-gray-500 animate-fade-in';
            notificationDiv.textContent = 'Chat has been restarted';
            chatMessages.appendChild(notificationDiv);
            
            // Remove notification after 2 seconds
            setTimeout(() => {
                if (chatMessages.contains(notificationDiv)) {
                    chatMessages.removeChild(notificationDiv);
                }
                // Stop the rotation animation
                refreshChat.querySelector('i').classList.remove('fa-spin');
            }, 2000);
            
            // Reset chat state
            chatOpened = true;
            
            // Focus on input
            userInput.focus();
            
            // Scroll to bottom
            scrollToBottom();
        });
    }
    
    

    // Chat form submission
    if (chatForm && userInput && chatMessages) {
        chatForm.addEventListener('submit', sendMessage);
        
        // Add typing indicator for input field
        if (userInput && typingStatus) {
            userInput.addEventListener('focus', () => {
                userInput.classList.add('pr-16'); // Add padding for typing indicator
            });
            
            userInput.addEventListener('blur', () => {
                if (userInput.value.length === 0) {
                    userInput.classList.remove('pr-16');
                    typingStatus.classList.remove('active');
                    typingStatus.classList.add('hidden');
                }
            });
            
            userInput.addEventListener('input', () => {
                if (userInput.value.length > 0) {
                    typingStatus.classList.remove('hidden');
                    typingStatus.classList.add('active');
                } else {
                    typingStatus.classList.remove('active');
                    typingStatus.classList.add('hidden');
                }
            });
        }
    }
    
    // Send message function
    function sendMessage(e) {
        e.preventDefault();
        const message = userInput.value.trim();
        
        function isValidMessage(msg) {
            if (typeof msg !== 'string') return false;
            if (!msg.trim()) return false;
            if (msg.length > 500) return false;
            if (/[<>]/.test(msg)) return false;
            return true;
        }
        
        if (!isValidMessage(message)) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'flex items-start gap-2 mb-4';
            errorDiv.innerHTML = `
                <img src="./images/Logo-1.svg" alt="Bot" class="h-8 w-8 rounded-full ">
                <div class="bot-message max-w-[80%]">
                    <div>Please enter a valid message.</div>
                    <div class="text-xs text-gray-400 mt-1">${getCurrentTime()}</div>
                </div>
            `;
            chatMessages.appendChild(errorDiv);
            scrollToBottom();
            return;
        }
        
        // Add user message to chat
        const msgDiv = document.createElement('div');
        msgDiv.className = 'flex justify-end mb-4';
        msgDiv.innerHTML = `
            <div class="user-message max-w-[80%]">
                ${message}
                <div class="text-xs text-white/70 mt-1 text-right">${getCurrentTime()}</div>
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        userInput.value = '';
        
        // Remove any existing suggested questions when sending a new message
        const existingSuggestions = document.querySelector('.suggested-questions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }
        
        // Show typing indicator
        typingIndicator.classList.remove('hidden');
typingIndicator.classList.add('flex');
typingIndicator.innerHTML = `
    <div class="flex items-start gap-2">
        <img src="./images/Logo-1.png" alt="Bot" class="h-8 w-8 rounded-full">
        <div class="bg-primary/5 rounded-xl px-4 py-2 inline-block">
            <div class="flex gap-1 items-center">
                <span class="dot dot-1"></span>
                <span class="dot dot-2"></span>
            </div>
        `;
        // Make sure chat is visible
        if (chatbox.classList.contains('hidden')) {
            chatbox.classList.remove('hidden');
            isChatVisible = true;
            fab.className = 'fas fa-times';
        }
        
        // Send message to server
        sendMessageToServer(message);
        
        // Scroll to bottom
        scrollToBottom();
    }
    
    // Function to send message to server
    async function sendMessageToServer(message) {
        try {
            ('Preparing to send request to API');
            // Send message to API
            const requestBody = JSON.stringify({ message });
            ('Request body:', requestBody);
            
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestBody
            });
            
            ('Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.response || `Failed to get response: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            ('Parsed response data:', data);
            
            // Hide typing indicator after a short delay to make it feel more natural
            setTimeout(() => {
                typingIndicator.classList.add('hidden');
typingIndicator.classList.remove('flex');
                
                if (data && data.response) {
                    // Add bot response to chat with formatting
                    ('Adding bot response to chat:', data.response);
                    const botDiv = document.createElement('div');
                    botDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in bg-[#1350ff]';
                    
                    const botAvatar = document.createElement('img');
                    botAvatar.src = './images/Logo-1.png';
                    botAvatar.alt = 'Bot';
                    botAvatar.className = 'h-8 w-8 rounded-full';
                    
                    const messageContainer = document.createElement('div');
                    messageContainer.className = 'bot-message max-w-[80%]';
                    
                    const messageContent = document.createElement('div');
                    messageContent.innerHTML = formatBotResponse(data.response);
                    
                    const timestamp = document.createElement('div');
                    timestamp.className = 'text-xs text-gray-400 mt-1';
                    timestamp.textContent = getCurrentTime();
                    
                    messageContainer.appendChild(messageContent);
                    messageContainer.appendChild(timestamp);
                    
                    botDiv.appendChild(botAvatar);
                    botDiv.appendChild(messageContainer);
                    chatMessages.appendChild(botDiv);
                    
                    // Scroll to make sure the message is visible
                    scrollToBottom();
                    
                    // Add a small delay before showing the suggested questions
                    // This ensures they appear after the bot message is visible
                    setTimeout(() => {
                        // Always use the dynamically generated suggested questions from the server
                        if (Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
                            ('Rendering dynamic question chips:', data.suggestedQuestions);
                            renderQuestionChips(data.suggestedQuestions);
                            // Scroll again to make sure chips are visible
                            scrollToBottom();
                        }
                    }, 500);
                } else {
                    ('No response data found in:', data);
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'flex items-start gap-2 mb-2';
                    errorDiv.innerHTML = `
                        <img src="./images/Logo-1.svg" alt="Bot" class="h-8 w-8 rounded-full ">
                        <div class="bot-message max-w-[80%]">
                            <div>Sorry, I received an invalid response. Please try again.</div>
                            <div class="text-xs text-gray-400 mt-1">${getCurrentTime()}</div>
                        </div>
                    `;
                    chatMessages.appendChild(errorDiv);
                }
                
                // Scroll to bottom
                scrollToBottom();
            }, 1000);
            
        } catch (error) {
            ('Error in sendMessage:', error);
            
            // Hide typing indicator
            typingIndicator.classList.add('hidden');
typingIndicator.classList.remove('flex');
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'flex items-start gap-2 mb-4';
            errorDiv.innerHTML = `
                <img src="./images/Logo-1.svg" alt="Bot" class="h-8 w-8 rounded-full">
                <div class="bot-message max-w-[80%]">
                    <div>Sorry, I encountered an error: ${error.message}. Please try again later.</div>
                    <div class="text-xs text-gray-400 mt-1">${getCurrentTime()}</div>
                </div>
            `;
            chatMessages.appendChild(errorDiv);
            
            // Scroll to bottom
            scrollToBottom();
        }
    }
    
    // Function to scroll to the bottom of the chat with smooth animation
    
    // Function to scroll to the bottom of the chat with smooth animation
    function scrollToBottom() {
        // Use smooth scrolling if supported
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    // Post-process step list items for number+title beside each other
    function postProcessStepLists() {
      const chatMessages = document.getElementById('chat-messages');
      if (!chatMessages) return;
      // Only process <li> that are direct children of <ol>
      chatMessages.querySelectorAll('ol > li').forEach(li => {
        const liText = li.textContent.trim();
        // Skip if contains phone number or email
        if (/\+?\d[\d\s-]{7,}/.test(liText) || /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(liText)) return;
        // Match patterns like '1. Project Initiation' or '2. Discovery and Planning'
        const match = liText.match(/^(\d+)\.\s+(.+)/);
        if (match) {
          const number = match[1];
          const title = match[2];
          // Only style if title is not just digits (avoid phone numbers, zip codes, etc)
          if (!/^\d+$/.test(title.trim())) {
            li.innerHTML = `<span class='step-num'>${number}.</span> <span class='step-title'>${title}</span>`;
            li.classList.add('step-list-item');
          }
        }
      });
      // Wrap phone numbers and emails in .contact-info
      chatMessages.querySelectorAll('span, div, p, li').forEach(el => {
        if (el.children.length === 0) {
          let html = el.innerHTML;
          // Phone numbers
          html = html.replace(/(\+\d{1,3}[\s-]?(\d[\s-]?){6,})/g, '<span class="contact-info">$1</span>');
          // Emails
          html = html.replace(/([\w.-]+@[\w.-]+\.[a-zA-Z]{2,})/g, '<span class="contact-info">$1</span>');
          el.innerHTML = html;
        }
      });
    }

    
    // Format bot response with enhanced formatting
    function formatBotResponse(text) {
        // Add icons to section titles and make them main titles
        text = text.replace(/Services:/g, '<h3 class="message-title"><i class="fas fa-cogs"></i> Services:</h3>');
        text = text.replace(/Design:/g, '<h3 class="message-title"><i class="fas fa-paint-brush"></i> Design:</h3>');
        text = text.replace(/Development:/g, '<h3 class="message-title"><i class="fas fa-code"></i> Development:</h3>');
        text = text.replace(/Solutions:/g, '<h3 class="message-title"><i class="fas fa-lightbulb"></i> Solutions:</h3>');
        text = text.replace(/Industries Served:/g, '<h3 class="message-title"><i class="fas fa-industry"></i> Industries Served:</h3>');
        text = text.replace(/Leadership Team:/g, '<h3 class="message-title"><i class="fas fa-users"></i> Leadership Team:</h3>');
        text = text.replace(/Case Studies:/g, '<h3 class="message-title"><i class="fas fa-briefcase"></i> Case Studies:</h3>');
        text = text.replace(/Blog Posts:/g, '<h3 class="message-title"><i class="fas fa-blog"></i> Blog Posts:</h3>');
        text = text.replace(/Contact Information:/g, '<h3 class="message-title"><i class="fas fa-address-card"></i> Contact Information:</h3>');
        text = text.replace(/Work Inquiries:/g, '<h3 class="message-title"><i class="fas fa-envelope"></i> Work Inquiries:</h3>');
        text = text.replace(/Career Inquiries:/g, '<h3 class="message-title"><i class="fas fa-briefcase"></i> Career Inquiries:</h3>');
        text = text.replace(/FAQs:/g, '<h3 class="message-title"><i class="fas fa-question-circle"></i> FAQs:</h3>');
        text = text.replace(/Client Testimonials:/g, '<h3 class="message-title"><i class="fas fa-quote-left"></i> Client Testimonials:</h3>');
        text = text.replace(/Company Culture:/g, '<h3 class="message-title"><i class="fas fa-building"></i> Company Culture:</h3>');
        text = text.replace(/About Us:/g, '<h3 class="message-title"><i class="fas fa-info-circle"></i> About Us:</h3>');
        text = text.replace(/Technology Stack:/g, '<h3 class="message-title"><i class="fas fa-layer-group"></i> Technology Stack:</h3>');
        
        // Format lists with numbering and ensure each item starts on a new line
        let listItems = text.match(/^- (.+)$/gm);
        if (listItems) {
            let listIndex = 1;
            listItems.forEach(item => {
                const content = item.replace(/^- /, '');
                const numberedItem = `<div class="list-item"><span class="list-number">${listIndex}</span> ${content}</div>`;
                text = text.replace(item, numberedItem);
                listIndex++;
            });
        }
        
        // Format numbered case studies to ensure each is on a new line with title and description separated
        text = text.replace(/(\d+\. .+?)\n\s+(.+?)(?=(\s+\d+\.|$))/g, '<div class="case-study-item"><div class="case-study-title">$1</div><div class="case-study-description">$2</div></div>');
        
        // Format any remaining numbered items
        text = text.replace(/(\d+\.) ([^\n]+)/g, '<div class="numbered-item"><span class="list-number">$1</span> $2</div>');
        
        // Add line breaks after titles
        text = text.replace(/<\/h3>/g, '</h3><div class="title-separator"></div>');
        
        // Add more spacing between sections
        text = text.replace(/\n\n/g, '<div class="section-break"></div>');
        
        // Format Q&A style content with better spacing
        text = text.replace(/Q: (.+)\nA: (.+)/g, '<div class="qa-item"><div class="question"><strong>Q:</strong> $1</div><div class="answer"><strong>A:</strong> $2</div></div>');
        
        // Highlight company name
        text = text.replace(/Code Theorem/g, '<span class="highlight">Code Theorem</span>');
        
        // Highlight blog titles
        text = text.replace(/"([^"]+)"\s+\(([^\)]+)\)/g, '<span class="blog-title">"$1"</span> ($2)');
        
        // Highlight project names in case studies
        const projectRegex = /(E-commerce Platform|Mobile App|Corporate Website|CRM System|Analytics Dashboard|Healthcare Portal|Educational Platform|Booking System|Inventory Management|Portfolio Website)/g;
        text = text.replace(projectRegex, '<span class="project-name">$1</span>');
        
        // Highlight people names
        const peopleRegex = /(John Smith|Sarah Johnson|Michael Lee|Emily Chen|David Wilson|Jessica Brown|Robert Taylor|Amanda Martinez|James Anderson|Jennifer Thomas)/g;
        text = text.replace(peopleRegex, '<span class="person-name">$1</span>');
        
        // Highlight important points
        const importantTerms = ['key feature', 'major benefit', 'significant improvement', 'essential component', 'critical aspect', 'primary focus', 'main advantage', 'core value', 'fundamental principle', 'strategic goal'];
        importantTerms.forEach(term => {
            const regex = new RegExp(term, 'gi');
            text = text.replace(regex, `<span class="important-point">${term}</span>`);
        });
        
        // Add main title styling to subsection headers
        text = text.replace(/\*\*([^*]+)\*\*/g, '<span class="main-title">$1</span>');
        
        return text;
    }
    
    // Get current time in HH:MM format
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        return `${hours}:${minutes} ${ampm}`;
    }
});
