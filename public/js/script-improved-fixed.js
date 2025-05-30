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
let sessionId = localStorage.getItem('chatbot_session_id') || '';

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
            chip.textContent = truncateText(question);
            chip.addEventListener('click', function() {
                // Set the input value to the full question
                userInput.value = question;
                // Trigger the form submission
                chatForm.dispatchEvent(new Event('submit'));
            });
            suggestedQuestionsDiv.appendChild(chip);
        });
        chatMessages.appendChild(suggestedQuestionsDiv);
    }
    
    // Initialize chat container and visibility state - using global state variables
    
    // Open chat function
    function openChat() {
        if (!chatOpened) {
            chatOpened = true;
            // Focus on input after opening
            setTimeout(() => {
                if (userInput) userInput.focus();
            }, 300);
        }
        
        chatbox.classList.remove('hidden');
        chatbox.classList.add('flex');
        isChatVisible = true;
        resizeIframeState('open');
    }
    
    // Close chat function
    function closeChatWindow() {
        chatbox.classList.add('hidden');
        chatbox.classList.remove('flex');
        isChatVisible = false;
        resizeIframeState('closed');
    }
    
    // Toggle chat visibility
    if (chatToggle && chatbox) {
        chatToggle.addEventListener('click', () => {
            // If maximized, return to normal state first
            if (isMaximized) {
                // Add transitioning class to prevent flickering
                chatbox.classList.add('transitioning');
                
                // Remove maximized classes
                chatbox.classList.remove('maximized');
                chatbox.classList.add('normal');
                
                // Update button icon
                maximizeChat.innerHTML = '<i class="fas fa-expand-alt"></i>';
                
                // Update state
                isMaximized = false;
                
                // Remove transitioning class after animation completes
                setTimeout(() => {
                    chatbox.classList.remove('transitioning');
                }, 400); // Match CSS transition duration
            }
            
            if (!isChatVisible) {
                openChat();
                // Animate the FAB
                fab.classList.add('rotate-in');
                setTimeout(() => {
                    fab.classList.remove('rotate-in');
                }, 500);
            } else {
                closeChatWindow();
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
            
            if (!isMaximized) {
                // Add maximized classes
                chatbox.classList.remove('normal');
                chatbox.classList.add('maximized');
                
                // Update button icon
                maximizeChat.innerHTML = '<i class="fas fa-compress-alt"></i>';
                
                // Update state
                isMaximized = true;
                
                // Update iframe size
                resizeIframeState('maximized');
            } else {
                // Remove maximized classes
                chatbox.classList.remove('maximized');
                chatbox.classList.add('normal');
                
                // Update button icon
                maximizeChat.innerHTML = '<i class="fas fa-expand-alt"></i>';
                
                // Update state
                isMaximized = false;
                
                // Update iframe size
                resizeIframeState('open');
            }
            
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
            
            // Remove all messages except welcome message
            while (chatMessages.childNodes.length > 1) {
                chatMessages.removeChild(chatMessages.lastChild);
            }
            
            // Add welcome message back if it was removed
            if (chatMessages.childNodes.length === 0) {
                addWelcomeMessage();
            }
            
            // Remove rotation after animation completes
            setTimeout(() => {
                refreshChat.querySelector('i').classList.remove('fa-spin');
            }, 1000);
            
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
            userInput.addEventListener('input', () => {
                if (userInput.value.trim().length > 0) {
                    typingStatus.classList.add('active');
                    typingStatus.classList.remove('hidden');
                    
                    // If chat is hidden, show it
                    if (chatbox.classList.contains('hidden')) {
                        openChat();
                    }
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
        
        function isValidMessage(msg) {
            return msg && msg.trim().length > 0 && msg.trim().length < 500;
        }
        
        const message = userInput.value.trim();
        
        if (!isValidMessage(message)) {
            // Show error for invalid message
            if (message.length >= 500) {
                alert('Message is too long. Please limit to 500 characters.');
            }
            return;
        }
        
        // Clear input
        userInput.value = '';
        
        // Remove any existing chips
        const existingChips = chatMessages.querySelector('.suggested-questions');
        if (existingChips) {
            existingChips.remove();
        }
        
        // Add user message to chat
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'flex justify-end mb-4 animate-fade-in';
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'user-message max-w-[80%]';
        
        const messageContent = document.createElement('div');
        messageContent.textContent = message;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'text-xs text-gray-400 mt-1 text-right';
        timestamp.textContent = getCurrentTime();
        
        messageContainer.appendChild(messageContent);
        messageContainer.appendChild(timestamp);
        
        userMessageDiv.appendChild(messageContainer);
        chatMessages.appendChild(userMessageDiv);
        
        // Scroll to bottom
        scrollToBottom();
        
        // Send to server and get response
        sendMessageToServer(message);
    }
    
    // Function to send message to server
    async function sendMessageToServer(message) {
        try {
            // Show typing indicator
            typingIndicator.classList.remove('hidden');
            typingIndicator.classList.add('flex');
            typingIndicator.innerHTML = `
                <div class="flex items-start gap-2">
                    <img src="./images/Logo-1.png" alt="Bot" class="h-8 w-8 rounded-full">
                    <div class="bg-primary/5 rounded-xl px-4 py-2 inline-block">
                        <div class="flex gap-1 items-center">
                            <div class="w-2 h-2 bg-primary/30 rounded-full animate-pulse"></div>
                            <div class="w-2 h-2 bg-primary/30 rounded-full animate-pulse delay-100"></div>
                            <div class="w-2 h-2 bg-primary/30 rounded-full animate-pulse delay-200"></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Make sure chat is visible
            if (chatbox.classList.contains('hidden')) {
                openChat();
            }
            
            // Prepare request body with session ID if available
            const requestBody = JSON.stringify({ 
                message,
                sessionId: sessionId
            });
            
            // Send message to server
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestBody
            });
            
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            // Parse response
            const data = await response.json();
            
            // Save session ID if provided
            if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('chatbot_session_id', sessionId);
                console.log('Session ID saved:', sessionId);
            }
            
            // Hide typing indicator
            typingIndicator.classList.add('hidden');
            typingIndicator.classList.remove('flex');
            
            // Check for error
            if (data.error) {
                console.error('Error from server:', data.error);
                
                // Add error message to chat
                const errorDiv = document.createElement('div');
                errorDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
                
                const botAvatar = document.createElement('img');
                botAvatar.src = './images/Logo-1.png';
                botAvatar.alt = 'Bot';
                botAvatar.className = 'h-8 w-8 rounded-full';
                
                const messageContainer = document.createElement('div');
                messageContainer.className = 'bot-message error max-w-[80%]';
                
                const messageContent = document.createElement('div');
                messageContent.innerHTML = 'Sorry, I encountered an error processing your request. Please try again later.';
                
                const timestamp = document.createElement('div');
                timestamp.className = 'text-xs text-gray-400 mt-1';
                timestamp.textContent = getCurrentTime();
                
                messageContainer.appendChild(messageContent);
                messageContainer.appendChild(timestamp);
                
                errorDiv.appendChild(botAvatar);
                errorDiv.appendChild(messageContainer);
                chatMessages.appendChild(errorDiv);
                
                // Scroll to bottom
                scrollToBottom();
                return;
            }
            
            // Format and add bot response to chat
            const botResponseDiv = document.createElement('div');
            botResponseDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';

            const botAvatar = document.createElement('img');
            botAvatar.src = './images/Logo-1.png';
            botAvatar.alt = 'Bot';
            botAvatar.className = 'h-8 w-8 rounded-full';

            // Fix: define messageContainer and children
            const messageContainer = document.createElement('div');
            messageContainer.className = 'bot-message max-w-[80%]';

            const messageContent = document.createElement('div');
            messageContent.innerHTML = data.response;

            const timestamp = document.createElement('div');
            timestamp.className = 'text-xs text-gray-400 mt-1';
            timestamp.textContent = getCurrentTime();

            messageContainer.appendChild(messageContent);
            messageContainer.appendChild(timestamp);

            botResponseDiv.appendChild(botAvatar);
            botResponseDiv.appendChild(messageContainer);
            chatMessages.appendChild(botResponseDiv);
            
            // Process any suggested questions
            if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
                renderQuestionChips(data.suggestedQuestions);
            }
            
            // Post-process any lists for better formatting
            postProcessStepLists();
            
            // Scroll to bottom
            scrollToBottom();
        } catch (error) {
            console.error('Error in sendMessage:', error);
            
            // Hide typing indicator
            typingIndicator.classList.add('hidden');
            typingIndicator.classList.remove('flex');
            
            // Add error message to chat
            const errorDiv = document.createElement('div');
            errorDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
            
            const botAvatar = document.createElement('img');
            botAvatar.src = './images/Logo-1.png';
            botAvatar.alt = 'Bot';
            botAvatar.className = 'h-8 w-8 rounded-full';
            
            const messageContainer = document.createElement('div');
            messageContainer.className = 'bot-message error max-w-[80%]';
            
            const messageContent = document.createElement('div');
            messageContent.innerHTML = 'Sorry, I encountered an error connecting to the server. Please check your connection and try again.';
            
            const timestamp = document.createElement('div');
            timestamp.className = 'text-xs text-gray-400 mt-1';
            timestamp.textContent = getCurrentTime();
            
            messageContainer.appendChild(messageContent);
            messageContainer.appendChild(timestamp);
            
            errorDiv.appendChild(botAvatar);
            errorDiv.appendChild(messageContainer);
            chatMessages.appendChild(errorDiv);
            
            // Scroll to bottom
            scrollToBottom();
        }
    }
    
    // Function to scroll to the bottom of the chat with smooth animation
    function scrollToBottom() {
        if (chatMessages) {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
    
    // Post-process step list items for number+title beside each other
    function postProcessStepLists() {
        // Find all ordered list items
        chatMessages.querySelectorAll('ol.bot-list li').forEach(li => {
            // Check if the list item starts with a number followed by a title
            const text = li.textContent.trim();
            const match = text.match(/^(\d+)\s*[-:.)]?\s+(.+)$/);
            
            if (match) {
                const number = match[1];
                const title = match[2];
                
                // Only apply special formatting if the title isn't just a number
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
                html = html.replace(/(\+\d{1,3}[\s-]?\d{3,}[\s-]?\d{3,}[\s-]?\d{3,})/g, '<span class="contact-info">$1</span>');
                // Emails
                html = html.replace(/([\w.-]+@[\w.-]+\.[a-zA-Z]{2,})/g, '<span class="contact-info">$1</span>');
                el.innerHTML = html;
            }
        });
    }
    
    // Function to format bot responses with HTML formatting
    function formatBotResponse(text) {
        try {
            // Basic safety check
            if (!text || typeof text !== 'string') {
                console.error('Invalid text passed to formatBotResponse:', text);
                return 'Sorry, I encountered an error processing this response.';
            }
    
            // Replace line breaks with <br> tags
            text = text.replace(/\n/g, '<br>');
    
            // Format section titles with icons
            const sectionTitles = {
                'Services:': '<i class="fas fa-cogs"></i> Services',
                'About Us:': '<i class="fas fa-info-circle"></i> About Us',
                'Contact:': '<i class="fas fa-envelope"></i> Contact',
                'Projects:': '<i class="fas fa-project-diagram"></i> Projects',
                'Team:': '<i class="fas fa-users"></i> Team',
                'Technologies:': '<i class="fas fa-laptop-code"></i> Technologies',
                'Process:': '<i class="fas fa-tasks"></i> Process',
                'Benefits:': '<i class="fas fa-award"></i> Benefits'
            };
    
            // Apply section title formatting
            Object.keys(sectionTitles).forEach(title => {
                const regex = new RegExp(title, 'g');
                text = text.replace(regex, `<h3 class="message-title">${sectionTitles[title]}</h3>`);
            });
    
            // Format markdown headings (##, ###)
            text = text.replace(/(?:<br>|^)\s*(#{2,3})\s+(.+?)(?=<br>|$)/g, function(match, hashes, content) {
                const level = hashes.length;
                return `<h${level} class="message-title">${content.trim()}</h${level}>`;
            });
    
            // Format bold text (markdown style)
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Format italic text (markdown style)
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
            // Format bullet points
            const bulletListPattern = /((?:^|<br>)\s*[-*]\s+.*(?:<br>\s*[-*]\s+.*)*)/g;
            text = text.replace(bulletListPattern, function(match) {
                // Split the list into individual items
                const items = match.split(/<br>\s*[-*]\s+/);
                // Remove empty items and trim each item
                const filteredItems = items.filter(item => item.trim()).map(item => item.trim());
                // Convert to HTML list
                if (filteredItems.length > 0) {
                    return '<ul class="bot-list">' + 
                        filteredItems.map(item => `<li class="bot-list-item">${item}</li>`).join('') + 
                        '</ul>';
                }
                return match; // Return original if no valid items
            });
    
            // Format numbered lists (lines starting with 1., 2., etc.)
            const numberedListPattern = /((?:^|<br>)\s*\d+\.\s+.*(?:<br>\s*\d+\.\s+.*)*)/g;
            text = text.replace(numberedListPattern, function(match) {
                // Split the list into individual items
                const items = match.split(/<br>\s*\d+\.\s+/);
                // Remove empty items and trim each item
                const filteredItems = items.filter(item => item.trim()).map(item => item.trim());
                // Convert to HTML list
                if (filteredItems.length > 0) {
                    return '<ol class="bot-list">' + 
                        filteredItems.map(item => `<li class="bot-list-item">${item}</li>`).join('') + 
                        '</ol>';
                }
                return match; // Return original if no valid items
            });
            
            // Format phone numbers with special styling
            const phonePattern = /(\+?\d{1,3}[-.\\s]?)?\(?\d{3}\)?[-.\\s]?\d{3}[-.\\s]?\d{4}/g;
            text = text.replace(phonePattern, '<span class="phone-number">$&</span>');
    
            // Format email addresses
            const emailPattern = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
            text = text.replace(emailPattern, '<a href="mailto:$&" class="email-link">$&</a>');
            
            // Reduce extra spacing between paragraphs
            text = text.replace(/<br><br><br>/g, '<br><br>');
            text = text.replace(/<\/p><br><br>/g, '</p><br>');
            
            // Add special styling for Rajdip Khavad mentions
            text = text.replace(/Rajdip Khavad/g, '<strong class="team-lead">Rajdip Khavad</strong>');
    
            // Format phone numbers to prevent breaking
            text = text.replace(/(\+\d{1,3}[\s-]?\d{3,}[\s-]?\d{3,}[\s-]?\d{3,})/g, '<span class="contact-info">$1</span>');
            text = text.replace(/(\d{3,}[\s-]?\d{3,}[\s-]?\d{4,})/g, '<span class="contact-info">$1</span>');
            
            // Format any remaining numbered items that weren't part of a list
            text = text.replace(/<br>(\d+)\. ([^<]+)(?!<\/li>)/g, '<div class="numbered-item"><span class="list-number">$1.</span> <span class="numbered-content">$2</span></div>');
            
            // Add line breaks after titles
            text = text.replace(/<\/h3>/g, '</h3><div class="title-separator"></div>');
            
            // Format Q&A style content with better spacing
            text = text.replace(/Q: (.+)<br>A: (.+)/g, '<div class="qa-item"><div class="question"><strong>Q:</strong> $1</div><div class="answer"><strong>A:</strong> $2</div></div>');
            
            // Highlight company name
            text = text.replace(/Code Theorem/g, '<span class="highlight">Code Theorem</span>');
            
            return text;
        } catch (error) {
            console.error('Error in formatBotResponse:', error);
            return text; // Return original text if there's an error
        }
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
