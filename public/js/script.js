document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    
    // DOM Elements
    const chatToggle = document.getElementById('chat-toggle');
    const chatbox = document.getElementById('chatbox');
    const closeChat = document.getElementById('close-chat');
    const minimizeChat = document.getElementById('minimize-chat');
    const refreshChat = document.getElementById('refresh-chat');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const welcomeTimestamp = document.getElementById('welcome-timestamp');
    const typingStatus = document.querySelector('.typing-status');
    
    // Add welcome message on page load
    addWelcomeMessage();
    
    // Function to add welcome message and default suggested questions (chips)
    function addWelcomeMessage() {
        // Add welcome message
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
        
        const botAvatar = document.createElement('img');
        botAvatar.src = './images/Logo-1.svg';
        botAvatar.alt = 'Bot';
        botAvatar.className = 'h-8 w-8 rounded-full';
        
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
            "How can I contact you?",
            "Who is on your leadership team?"
        ]);
    }

    // Function to render question chips (removes any previous chips)
    function renderQuestionChips(chipsArray) {
        console.log('Rendering chips with data:', chipsArray);
        
        // Remove any existing chips
        const existingChips = chatMessages.querySelector('.suggested-questions');
        if (existingChips) {
            existingChips.remove();
        }
        
        // Don't render if no questions
        if (!chipsArray || !chipsArray.length) {
            console.warn('No question chips to render');
            return;
        }
        
        // Create container for suggested questions
        const suggestedQuestionsDiv = document.createElement('div');
        suggestedQuestionsDiv.className = 'suggested-questions flex flex-wrap gap-2 mt-4 mb-4 animate-fade-in';
        
        // Add a title to make it more visible
        const titleElement = document.createElement('div');
        titleElement.className = 'w-full text-sm text-gray-500 mb-2';
        titleElement.textContent = 'Suggested questions:';
        suggestedQuestionsDiv.appendChild(titleElement);
        
        // Function to truncate text
        const truncateText = (text, maxLength = 25) => {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        };
        
        // Create each chip with truncated text
        chipsArray.forEach(question => {
            const chip = document.createElement('div');
            chip.className = 'chip cursor-pointer';
            chip.setAttribute('data-question', question);
            chip.setAttribute('data-expanded', 'false');
            chip.setAttribute('title', question); // Show full question on hover
            
            // Display truncated version of the question
            const truncatedQuestion = truncateText(question);
            chip.textContent = truncatedQuestion;
            
            // Add click event with toggle behavior
            chip.addEventListener('click', function() {
                const isExpanded = this.getAttribute('data-expanded') === 'true';
                
                if (isExpanded) {
                    // If already expanded, submit the question
                    console.log('Submitting question:', question);
                    userInput.value = question;
                    userInput.focus();
                    chatForm.dispatchEvent(new Event('submit'));
                } else {
                    // First click - expand to show full question
                    console.log('Expanding question chip:', question);
                    
                    // Reset all other chips to collapsed state
                    document.querySelectorAll('.chip').forEach(c => {
                        if (c !== this) {
                            c.setAttribute('data-expanded', 'false');
                            c.textContent = truncateText(c.getAttribute('data-question'));
                            c.classList.remove('expanded');
                        }
                    });
                    
                    // Expand this chip
                    this.textContent = question;
                    this.setAttribute('data-expanded', 'true');
                    this.classList.add('expanded');
                }
            });
            
            suggestedQuestionsDiv.appendChild(chip);
        });
        
        // Add to chat
        chatMessages.appendChild(suggestedQuestionsDiv);
        
        // Scroll to make sure chips are visible
        setTimeout(scrollToBottom, 100);
    }
    
    // State variables
    let isChatVisible = false;
    let isMinimized = false;
    let chatOpened = false;
    
    // Initialize chat container and visibility state
    const fab = document.querySelector('#chat-toggle i');
    
    // Function to resize iframe if in iframe context
    function resizeIframe(width, height) {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'chatbot-resize',
                width,
                height
            }, '*');
        }
    }
    
    // Open chat function
    function openChat() {
        console.log('Opening chat...');
        chatbox.classList.remove('hidden');
        isChatVisible = true;
        fab.className = 'fas fa-times';
        
        // Resize iframe if in iframe context
        resizeIframe(400, 600);
        
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
        console.log('Closing chat...');
        chatbox.classList.add('hidden');
        isChatVisible = false;
        fab.className = 'fas fa-comment-dots text-2xl';
        
        // Resize iframe if in iframe context
        resizeIframe(71, 71);
        
        // If minimized, restore it when hidden
        if (isMinimized) {
            chatbox.classList.remove('minimized');
            isMinimized = false;
            minimizeChat.innerHTML = '<i class="fas fa-minus"></i>';
        }
    }
    
    // Toggle chat visibility
    if (chatToggle && chatbox) {
        chatToggle.addEventListener('click', () => {
            if (isMinimized) {
                // If minimized, restore it first
                chatbox.classList.remove('minimized');
                isMinimized = false;
                minimizeChat.innerHTML = '<i class="fas fa-minus"></i>';
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
    
    // Minimize/Maximize chat
    if (minimizeChat && chatbox) {
        minimizeChat.addEventListener('click', () => {
            chatbox.classList.toggle('minimized');
            isMinimized = chatbox.classList.contains('minimized');
            minimizeChat.innerHTML = isMinimized ? 
                '<i class="fas fa-expand-alt"></i>' : 
                '<i class="fas fa-minus"></i>';
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
    
    // Handle suggested questions
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            userInput.value = question;
            userInput.focus();
        });
    });

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
        
        if (message.length === 0) return;
        
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
        typingIndicator.style.display = 'flex';
        
        // Make sure chat is visible and not minimized
        if (chatbox.classList.contains('hidden')) {
            chatbox.classList.remove('hidden');
            isChatVisible = true;
            fab.className = 'fas fa-times';
        }
        
        if (chatbox.classList.contains('minimized')) {
            chatbox.classList.remove('minimized');
            isMinimized = false;
            minimizeChat.innerHTML = '<i class="fas fa-minus"></i>';
        }
        
        // Send message to server
        sendMessageToServer(message);
        
        // Scroll to bottom
        scrollToBottom();
    }
    
    // Function to send message to server
    async function sendMessageToServer(message) {
        try {
            console.log('Preparing to send request to API');
            // Send message to API
            const requestBody = JSON.stringify({ message });
            console.log('Request body:', requestBody);
            
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestBody
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.response || `Failed to get response: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Parsed response data:', data);
            
            // Hide typing indicator after a short delay to make it feel more natural
            setTimeout(() => {
                typingIndicator.style.display = 'none';
                
                if (data && data.response) {
                    // Add bot response to chat with formatting
                    console.log('Adding bot response to chat:', data.response);
                    const botDiv = document.createElement('div');
                    botDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
                    
                    const botAvatar = document.createElement('img');
                    botAvatar.src = './images/Logo-1.svg';
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
                            console.log('Rendering dynamic question chips:', data.suggestedQuestions);
                            renderQuestionChips(data.suggestedQuestions);
                            // Scroll again to make sure chips are visible
                            scrollToBottom();
                        }
                    }, 500);
                } else {
                    console.error('No response data found in:', data);
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'flex items-start gap-2 mb-2';
                    errorDiv.innerHTML = `
                        <img src="./images/Logo-1.svg" alt="Bot" class="h-8 w-8 rounded-full">
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
            console.error('Error in sendMessage:', error);
            
            // Hide typing indicator
            typingIndicator.style.display = 'none';
            
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
