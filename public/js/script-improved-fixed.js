// Utility to tell parent to resize iframe using state-based protocol
function resizeIframeState(state, transitionDuration = 400) {
    console.log('[Chatbot iframe] Calling resizeIframeState("' + state + '")');
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'chatbot-resize',
            state: state,
            transitionDuration: transitionDuration
        }, '*');
        console.log('[Chatbot iframe] postMessage sent to parent:', { type: 'chatbot-resize', state, transitionDuration });
    }
}

// Global state variables
let isChatVisible = false;
let isMaximized = false;
let chatOpened = false;
let sessionId = localStorage.getItem('chatbot_session_id') || '';

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Chatbot iframe] DOMContentLoaded fired, script loaded.');
    // Initialize DOM elements
    const chatbox = document.getElementById('chatbox');
    const chatToggle = document.getElementById('chat-toggle');
    const closeChat = document.getElementById('close-chat');
    const maximizeChat = document.getElementById('maximize-chat');
    const refreshChat = document.getElementById('refresh-chat');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
  
    const welcomeTimestamp = document.getElementById('welcome-timestamp');
    const typingStatus = document.querySelector('.typing-status');
    const fab = document.querySelector('#chat-toggle i'); // Moved fab declaration here to avoid redeclaration
    const chatForm = document.getElementById('chat-form');
    
    // Add welcome message on page load
    addWelcomeMessage();
    
    // Function to create a logo avatar with the new branding
    function createLogoAvatar() {
        const botAvatar = document.createElement('div');
        botAvatar.style.minWidth = '32px';
        botAvatar.style.minHeight = '32px';
        botAvatar.style.borderRadius = '40px';
       
        botAvatar.style.display = 'flex';
        botAvatar.style.alignItems = 'center';
        botAvatar.style.justifyContent = 'center';
        botAvatar.style.background = 'linear-gradient(90deg, #1350FF 0%, #D900FF 100%)';
        
        // Add SVG logo inside the div
        botAvatar.innerHTML = `
            <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_216_6931)">
                    <g clip-path="url(#clip1_216_6931)">
                        <path d="M16.3486 13.7776L18.0254 15.9953C18.5869 16.7345 18.0614 17.7802 17.1377 17.7805H3.20606C2.28223 17.7804 1.7568 16.7165 2.31837 15.9953L4.0088 13.7776H16.3486ZM11.0869 6.81857L16.3584 13.7776H16.3486L11.0869 6.81857ZM10.1983 6.37228C9.86789 6.37449 9.53628 6.52339 9.31153 6.81857L4.0088 13.7776H3.98536L9.31153 6.81857C9.53025 6.51934 9.86336 6.37046 10.1983 6.37228ZM10.1983 6.37228C10.5337 6.37003 10.8679 6.51885 11.0869 6.81857C10.8619 6.52289 10.5291 6.37408 10.1983 6.37228Z" fill="white"/>
                        <path d="M8.89528 0.779515C9.47499 0.022266 10.6164 0.022266 11.1961 0.779515L19.8006 12.174C20.2897 12.8411 19.8185 13.7785 18.9851 13.7785H16.3591L11.0867 6.81858C10.6338 6.22372 9.74605 6.22364 9.3113 6.81858L3.98513 13.7785H1.01442C0.181116 13.7785 -0.28969 12.8231 0.217547 12.174L8.89528 0.779515Z" fill="white"/>
                    </g>
                </g>
                <defs>
                    <clipPath id="clip0_216_6931">
                        <rect width="20" height="17.561" fill="white" transform="translate(0 0.219513)"/>
                    </clipPath>
                    <clipPath id="clip1_216_6931">
                        <rect width="20" height="17.561" fill="white" transform="translate(0 0.219757)"/>
                    </clipPath>
                </defs>
            </svg>
        `;
        return botAvatar;
    }

    // Function to create schedule call button
    function createScheduleCallButton() {
        const scheduleButton = document.createElement('div');
        scheduleButton.className = 'schedule-call-button';
        
        // Create SVG icon
        const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgIcon.setAttribute('width', '20');
        svgIcon.setAttribute('height', '21');
        svgIcon.setAttribute('viewBox', '0 0 20 21');
        svgIcon.setAttribute('fill', 'none');
        svgIcon.innerHTML = `
            <path d="M9.79521 4.3869C9.86554 4.19672 10.1345 4.19672 10.2049 4.3869C10.99 6.50867 11.3826 7.56955 12.1565 8.34346C12.9304 9.11733 13.9913 9.50992 16.113 10.2951C16.3032 10.3654 16.3032 10.6344 16.113 10.7048C13.9913 11.4899 12.9304 11.8825 12.1565 12.6564C11.3826 13.4303 10.99 14.4912 10.2049 16.6129C10.1345 16.8031 9.86554 16.8031 9.79521 16.6129C9.01004 14.4912 8.61746 13.4303 7.84358 12.6564C7.06967 11.8825 6.00879 11.4899 3.88702 10.7048C3.69684 10.6344 3.69684 10.3654 3.88702 10.2951C6.00879 9.50992 7.06967 9.11733 7.84358 8.34346C8.61746 7.56955 9.01004 6.50867 9.79521 4.3869Z" fill="url(#paint0_linear_192_17536)"/>
            <path d="M4.97481 5.47469C5.21889 5.23061 5.61462 5.23061 5.8587 5.47468L6.9065 6.52248C7.15058 6.76656 7.15058 7.16228 6.9065 7.40636C6.66243 7.65044 6.2667 7.65044 6.02262 7.40636L4.97482 6.35857C4.73074 6.11449 4.73074 5.71876 4.97481 5.47469ZM13.0937 13.5935C13.3378 13.3495 13.7335 13.3495 13.9776 13.5935L15.0253 14.6414C15.2694 14.8855 15.2694 15.2811 15.0253 15.5252C14.7813 15.7693 14.3856 15.7693 14.1415 15.5252L13.0937 14.4775C12.8496 14.2334 12.8496 13.8376 13.0937 13.5935ZM15.0253 5.47469C15.2694 5.71877 15.2694 6.1145 15.0253 6.35857L13.9776 7.40638C13.7335 7.65046 13.3378 7.65046 13.0937 7.40638C12.8496 7.16231 12.8496 6.76658 13.0937 6.5225L14.1415 5.4747C14.3856 5.23061 14.7813 5.23061 15.0253 5.47469ZM6.9065 13.5935C7.15058 13.8376 7.15057 14.2334 6.9065 14.4775L5.85869 15.5252C5.6146 15.7693 5.21888 15.7693 4.9748 15.5252C4.73073 15.2811 4.73073 14.8855 4.97481 14.6414L6.02262 13.5935C6.2667 13.3495 6.66243 13.3495 6.9065 13.5935Z" fill="url(#paint1_linear_192_17536)"/>
            <defs>
            <linearGradient id="paint0_linear_192_17536" x1="3.74438" y1="10.4999" x2="16.2557" y2="10.4999" gradientUnits="userSpaceOnUse">
            <stop stop-color="#1350FF"/>
            <stop offset="1" stop-color="#D900FF"/>
            </linearGradient>
            <linearGradient id="paint1_linear_192_17536" x1="4.79175" y1="10.5" x2="15.2084" y2="10.5" gradientUnits="userSpaceOnUse">
            <stop stop-color="#1350FF"/>
            <stop offset="1" stop-color="#D900FF"/>
            </linearGradient>
            </defs>
        `;
        
        // Create text span
        const textSpan = document.createElement('span');
        textSpan.textContent = 'Schedule a quick call with our team';
        
        // Add SVG and text to button
        scheduleButton.appendChild(svgIcon);
        scheduleButton.appendChild(textSpan);
        
        // Add click event listener
        scheduleButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Open a new tab or window with a scheduling page
            window.open('https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1DWDVBt5otBEMOih2n9JJlORLYRklNjxEuKoZ6UcCjuhq8SsOxz8VvtMxjz0NPuZplBRA21bO6', '_blank');
        });
        
        return scheduleButton;
    }

    // Function to add welcome message and default suggested questions (chips)
    function addWelcomeMessage() {
        const welcomeMessageDiv = document.createElement('div');
        welcomeMessageDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
        
        // Use the createLogoAvatar function
        const botAvatar = createLogoAvatar();
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'bot-message';
        
        const messageContent = document.createElement('div');
        messageContent.innerHTML = 'Hello! How can I assist you today?';
        messageContent.style.width = '100%'; // Ensure content takes full width in flexbox
        
        messageContainer.appendChild(messageContent);
        
        welcomeMessageDiv.appendChild(botAvatar);
        welcomeMessageDiv.appendChild(messageContainer);
        chatMessages.appendChild(welcomeMessageDiv);
        
        // Add suggested questions and schedule call button after welcome message
        renderQuestionChips([]);

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

    // Function to render question chips
    function renderQuestionChips(chipsArray) {
        // Remove any existing chips and containers
        const existingChipsContainers = chatMessages.querySelectorAll('.suggested-questions-container');
        existingChipsContainers.forEach(container => {
            container.remove();
        });
        
        // Find the last bot message div (the parent container of the bot-message)
        const botMessageDivs = chatMessages.querySelectorAll('.flex.items-start.gap-2.mb-4.animate-fade-in');
        const lastBotMessageDiv = botMessageDivs[botMessageDivs.length - 1];
        
        if (!lastBotMessageDiv) {
            return; // No bot message to append to
        }
        
        // Create container for suggested questions
        const suggestedQuestionsDiv = document.createElement('div');
        // Align chips in a column with gap
        suggestedQuestionsDiv.className = 'suggested-questions';
        
        // Create a new div to contain the suggested questions
        const suggestedQuestionsContainer = document.createElement('div');
        suggestedQuestionsContainer.className = 'flex items-start gap-2 mt-0 animate-fade-in suggested-questions-container';
        
        // Add the same left margin as the bot message to align with it
        suggestedQuestionsContainer.style.marginLeft = '40px'; // Adjust this value based on your layout
        
        // Show up to 3 chips if we have suggested questions
        if (chipsArray && chipsArray.length) {
            const chipsToShow = chipsArray.slice(0, 3);
            chipsToShow.forEach((question) => {
                const chip = document.createElement('div');
                chip.className = 'chip';
                
                // Create SVG icon
                const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgIcon.setAttribute('width', '20');
                svgIcon.setAttribute('height', '21');
                svgIcon.setAttribute('viewBox', '0 0 20 21');
                svgIcon.setAttribute('fill', 'none');
                svgIcon.style.marginRight = '8px';
                svgIcon.innerHTML = `
                    <path d="M9.79521 4.3869C9.86554 4.19672 10.1345 4.19672 10.2049 4.3869C10.99 6.50867 11.3826 7.56955 12.1565 8.34346C12.9304 9.11733 13.9913 9.50992 16.113 10.2951C16.3032 10.3654 16.3032 10.6344 16.113 10.7048C13.9913 11.4899 12.9304 11.8825 12.1565 12.6564C11.3826 13.4303 10.99 14.4912 10.2049 16.6129C10.1345 16.8031 9.86554 16.8031 9.79521 16.6129C9.01004 14.4912 8.61746 13.4303 7.84358 12.6564C7.06967 11.8825 6.00879 11.4899 3.88702 10.7048C3.69684 10.6344 3.69684 10.3654 3.88702 10.2951C6.00879 9.50992 7.06967 9.11733 7.84358 8.34346C8.61746 7.56955 9.01004 6.50867 9.79521 4.3869Z" fill="url(#paint0_linear_225_6790)"/>
                    <path d="M4.97469 5.47469C5.21877 5.23061 5.6145 5.23061 5.85857 5.47468L6.90638 6.52248C7.15046 6.76656 7.15046 7.16228 6.90638 7.40636C6.66231 7.65044 6.26658 7.65044 6.0225 7.40636L4.9747 6.35857C4.73061 6.11449 4.73061 5.71876 4.97469 5.47469ZM13.0935 13.5935C13.3376 13.3495 13.7334 13.3495 13.9775 13.5935L15.0252 14.6414C15.2693 14.8855 15.2693 15.2811 15.0252 15.5252C14.7811 15.7693 14.3855 15.7693 14.1414 15.5252L13.0935 14.4775C12.8495 14.2334 12.8495 13.8376 13.0935 13.5935ZM15.0252 5.47469C15.2693 5.71877 15.2693 6.1145 15.0252 6.35857L13.9775 7.40638C13.7334 7.65046 13.3376 7.65046 13.0935 7.40638C12.8495 7.16231 12.8495 6.76658 13.0935 6.5225L14.1414 5.4747C14.3855 5.23061 14.7811 5.23061 15.0252 5.47469ZM6.90638 13.5935C7.15046 13.8376 7.15045 14.2334 6.90637 14.4775L5.85856 15.5252C5.61448 15.7693 5.21876 15.7693 4.97468 15.5252C4.73061 15.2811 4.73061 14.8855 4.97469 14.6414L6.0225 13.5935C6.26657 13.3495 6.66231 13.3495 6.90638 13.5935Z" fill="url(#paint1_linear_225_6790)"/>
                    <defs>
                        <linearGradient id="paint0_linear_225_6790" x1="3.74438" y1="10.4999" x2="16.2557" y2="10.4999" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#1350FF"/>
                            <stop offset="1" stop-color="#D900FF"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_225_6790" x1="4.79163" y1="10.5" x2="15.2083" y2="10.5" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#1350FF"/>
                            <stop offset="1" stop-color="#D900FF"/>
                        </linearGradient>
                    </defs>
                `;
                
                // Create text span
                const textSpan = document.createElement('span');
                textSpan.textContent = truncateText(question);
                
                // Add SVG and text to chip
                chip.appendChild(svgIcon);
                chip.appendChild(textSpan);
                
                chip.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Get the chatbar input element
                    const chatbarInput = document.getElementById('chatbar-input');
                    if (chatbarInput) {
                        // Set the input value to the full question
                        chatbarInput.value = question;
                        // Expand the chat input if it's not already expanded
                        const chatInputBar = document.getElementById('chat-input-bar');
                        if (chatInputBar) {
                            chatInputBar.classList.add('expanded');
                        }
                        // Find the chat form
                        const chatbarForm = document.getElementById('chatbar-form');
                        if (chatbarForm) {
                            // Trigger the form submission
                            chatbarForm.dispatchEvent(new Event('submit'));
                        } else {
                            // Fallback to the original form if available
                            if (chatForm) {
                                chatForm.dispatchEvent(new Event('submit'));
                            }
                        }
                    }
                });
                suggestedQuestionsDiv.appendChild(chip);
            });
        }
        
        // Create and add schedule call button
        const scheduleButton = createScheduleCallButton();
        suggestedQuestionsDiv.appendChild(scheduleButton);
        
        // Append the suggested questions to the container
        suggestedQuestionsContainer.appendChild(suggestedQuestionsDiv);
        
        // Insert the container after the last bot message div
        chatMessages.insertBefore(suggestedQuestionsContainer, lastBotMessageDiv.nextSibling);
    // Initialize chat container and visibility state - using global state variables
    
    // Listen for open trigger from parent
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'chatbot-open') {
            resizeIframeState('open');
        }
    });

    // Expand iframe when chatbar-form is clicked
    const chatbarForm = document.getElementById('chatbar-form');
    let hasRequestedResize = false;
    if (chatbarForm) {
        console.log('[Chatbot iframe] chatbar-form found. Adding click listener.');
        chatbarForm.addEventListener('click', function () {
            if (!hasRequestedResize) {
                hasRequestedResize = true;
                console.log('[Chatbot iframe] chatbar-form clicked. Sending resizeIframeState("open")');
                resizeIframeState('open');
                // Do NOT call openChatboxUI() here; wait for parent signal
            }
        });
    } else {
        console.warn('[Chatbot iframe] chatbar-form element not found!');
    }

    // Listen for parent signal that iframe has finished expanding
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'chatbot-iframe-expanded') {
            console.log('[Chatbot iframe] Received chatbot-iframe-expanded from parent. Now opening chatbox UI.');
            openChatboxUI();
            hasRequestedResize = false;
        }
    });

    // Open chat function (now openChatboxUI)
    function openChatboxUI() {
        if (!chatOpened) {
            chatOpened = true;
            setTimeout(() => {
                if (userInput) userInput.focus();
            }, 300);
        }
        // Remove any hide/fade-out classes
        chatbox.classList.remove('ct-chatbox-hide');
        // Add fade-in-up animation
        chatbox.classList.add('ct-chatbox-transition');
        // Show chatbox
        chatbox.classList.remove('hidden');
        chatbox.classList.add('flex');
        isChatVisible = true;
        // Do NOT call resizeIframeState('open') here; handled by chatbar-form click and parent transition only
        // Remove animation class after animation completes (cleanup)
        setTimeout(() => {
            chatbox.classList.remove('ct-chatbox-transition');
        }, 400);
    }

    // Close chat function
    function closeChatWindow() {
        // Add fade-out-down animation
        chatbox.classList.remove('ct-chatbox-transition');
        chatbox.classList.add('ct-chatbox-hide');
        // After animation, hide the chatbox
        setTimeout(() => {
            chatbox.classList.add('hidden');
            chatbox.classList.remove('flex');
            chatbox.classList.remove('ct-chatbox-hide');
            isChatVisible = false;
            resizeIframeState('closed');
        }, 350);
    }

    // Toggle chat visibility - disabled as we now use the input bar to control chat visibility
    // Our new chat-input-handler.js handles this functionality
    if (chatToggle && chatbox) {
        chatToggle.style.display = 'none'; // Hide the old toggle button
    }
    
    // Close chat button event
    if (closeChat && chatbox) {
        closeChat.addEventListener('click', () => {
            console.log('[Chatbot iframe] closeChat clicked. Sending resizeIframeState("closed")');
            closeChatWindow();
            resizeIframeState('closed');
        });
    }
    
    // Maximize chat functionality disabled
    // We're using a new UI approach with fixed dimensions
    if (maximizeChat && chatbox) {
        // Remove the maximize button or disable its functionality
        maximizeChat.style.display = 'none';
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
}

    // Send message function
    function sendMessage(e) {
        e.preventDefault();
        function isValidMessage(msg) {
            return msg && msg.trim().length > 0 && msg.trim().length < 500;
        }
        const message = userInput.value.trim();
        if (!isValidMessage(message)) {
            if (message.length >= 500) {
                alert('Message is too long. Please limit to 500 characters.');
            }
            return;
        }
        userInput.value = '';
        const existingChips = chatMessages.querySelector('.suggested-questions');
        if (existingChips) existingChips.remove();
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'flex justify-end mb-4 animate-fade-in';
        const messageContainer = document.createElement('div');
        messageContainer.className = 'user-message';
        const messageContent = document.createElement('div');
        messageContent.textContent = message;
        messageContent.style.width = '100%';
        messageContainer.appendChild(messageContent);
        userMessageDiv.appendChild(messageContainer);
        chatMessages.appendChild(userMessageDiv);
        scrollToBottom();
        window.sendMessageToServer(message);
    }

    // Function to send message to server - making it globally available
    window.sendMessageToServer = async function(message) {
        
        try {
           
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
            const response = await fetch('http://localhost:3000/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestBody
            });
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const data = await response.json();
            if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('chatbot_session_id', sessionId);
                console.log('Session ID saved:', sessionId);
            }
        
            if (data.error) {
                console.error('Error from server:', data.error);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
                const botAvatar = createLogoAvatar();
                const messageContainer = document.createElement('div');
                messageContainer.className = 'bot-message error';
                const messageContent = document.createElement('div');
                messageContent.innerHTML = 'Sorry, I encountered an error processing your request. Please try again later.';
                messageContent.style.width = '100%';
                messageContainer.appendChild(messageContent);
                errorDiv.appendChild(botAvatar);
                errorDiv.appendChild(messageContainer);
                chatMessages.appendChild(errorDiv);
                renderQuestionChips([]);
                scrollToBottom();
                return;
            }
            const botResponseDiv = document.createElement('div');
            botResponseDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
            const botAvatar = createLogoAvatar();
            const messageContainer = document.createElement('div');
            messageContainer.className = 'bot-message';
            const messageContent = document.createElement('div');
            messageContent.innerHTML = data.response;
            messageContent.style.width = '100%';
            messageContainer.appendChild(messageContent);
            botResponseDiv.appendChild(botAvatar);
            botResponseDiv.appendChild(messageContainer);
            chatMessages.appendChild(botResponseDiv);
            if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
                renderQuestionChips(data.suggestedQuestions);
            } else {
                renderQuestionChips([]);
            }
            postProcessStepLists();
            scrollToBottom();
        } catch (error) {
            console.error('Error in sendMessage:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
            const botAvatar = createLogoAvatar();
            const messageContainer = document.createElement('div');
            messageContainer.className = 'bot-message error';
            const messageContent = document.createElement('div');
            messageContent.innerHTML = 'Sorry, I encountered an error connecting to the server. Please check your connection and try again.';
            messageContent.style.width = '100%';
            messageContainer.appendChild(messageContent);
            errorDiv.appendChild(botAvatar);
            errorDiv.appendChild(messageContainer);
            chatMessages.appendChild(errorDiv);
            renderQuestionChips([]);
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
    
    // Post-process bot messages for consistent styling
    function postProcessStepLists() {
        // Convert all ordered lists to unordered lists with bullet points
        chatMessages.querySelectorAll('ol').forEach(ol => {
            ol.style.listStyleType = 'disc';
        });
        
        // Remove any special formatting from list items
        chatMessages.querySelectorAll('li').forEach(li => {
            // Preserve the text content but remove special formatting
            const text = li.textContent.trim();
            li.classList.remove('step-list-item');
            
            // If the li has special spans for numbers/titles, simplify them
            if (li.querySelector('.step-num') || li.querySelector('.step-title') || 
                li.querySelector('.list-number') || li.querySelector('.numbered-title')) {
                li.innerHTML = text;
            }
        });
        
        // Keep phone numbers and emails as plain text without special formatting
        chatMessages.querySelectorAll('.contact-info').forEach(el => {
            const text = el.textContent;
            const parent = el.parentNode;
            if (parent) {
                const textNode = document.createTextNode(text);
                parent.replaceChild(textNode, el);
            }
        });
        
        // Apply correct font styling to titles in bot messages
        chatMessages.querySelectorAll('.bot-message').forEach(botMessage => {
            // Find all heading elements and strong tags (titles)
            const titleElements = botMessage.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b');
            
            titleElements.forEach(title => {
                title.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
                title.style.fontWeight = "700";
                title.style.fontSize = "16px";
                title.style.lineHeight = "150%";
                title.style.letterSpacing = "0%";
                title.style.color = "var(--color-text)";
                title.style.marginBottom = "8px";
            });
            
            // Apply consistent styling to paragraphs and other text elements
            const textElements = botMessage.querySelectorAll('p, span, div:not(.chip):not(.suggested-questions):not(.suggested-questions-container)');
            
            textElements.forEach(text => {
                if (!text.querySelector('h1, h2, h3, h4, h5, h6, strong, b')) {
                    text.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
                    text.style.fontWeight = "500";
                    text.style.fontSize = "16px";
                    text.style.lineHeight = "150%";
                    text.style.letterSpacing = "0%";
                    text.style.color = "var(--color-text)";
                }
            });
        });
    }
    
    // Import marked at the top of your file:
    // import { marked } from 'marked';

    // Optional: Add CSS classes or modify renderer for advanced customization
    if (typeof marked !== 'undefined' && marked.setOptions) {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        return text.replace(/&/g, "&amp;")
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;");
    }

    /**
     * Replace known keywords with styled elements
     */
    function highlightKeywords(html) {
        return html
            .replace(/Coty/g, '<span class="highlight">Coty</span>')
            .replace(/Rajdip Khavad/g, '<strong class="team-lead">Rajdip Khavad</strong>');
    }

    // Function removed as per user request

    /**
     * Format contact information (emails and phones)
     */
    function formatContactInfo(html) {
        const emailRegex = /\b[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}\b/g;
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;

        return html
            .replace(emailRegex, match => `<a href="mailto:${match}" class="email-link">${match}</a>`)
            .replace(phoneRegex, match => `<span class="phone-number">${match}</span>`);
    }

    /**
     * Add Q&A formatting and other enhancements
     */
    function enhanceStructure(html) {
        // Add separators after section headings
        html = html.replace(/<\/h[23]>/g, '</h3><div class="title-separator"></div>');

        // Q&A formatting
        html = html.replace(/<p>Q:\s*(.+?)<br\s*\/?>(?:A:|A\.)\s*(.+?)<\/p>/g, `
            <div class="qa-item">
                <div class="question"><strong>Q:</strong> $1</div>
                <div class="answer"><strong>A:</strong> $2</div>
            </div>
        `);

        return html;
    }

    /**
     * Main formatting function
     */
    function formatBotResponse(text) {
        try {
            if (!text || typeof text !== 'string') {
                console.error('Invalid text passed to formatBotResponse:', text);
                return 'Sorry, I encountered an error processing this response.';
            }

            // Normalize line breaks for consistent processing
            text = text.replace(/\r\n|\r/g, '\n');

            // Escape HTML first
            const safeText = escapeHtml(text);
            
            // Convert markdown to HTML
            let html = (typeof marked !== 'undefined') ? marked.parse(safeText) : safeText;

            // Apply enhancements
            html = highlightKeywords(html);
            // applySectionIcons removed as per user request
            html = formatContactInfo(html);
            html = enhanceStructure(html);

            return html;

        } catch (error) {
            console.error('Error in formatBotResponse:', error);
            return 'Oops! Something went wrong formatting this message.';
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
