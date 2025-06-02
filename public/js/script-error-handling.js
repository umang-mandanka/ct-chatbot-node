// Function to create the logo avatar SVG container
function createLogoAvatar() {
    const avatarContainer = document.createElement('div');
    avatarContainer.style.width = '24px';
    avatarContainer.style.height = '24px';
    avatarContainer.style.borderRadius = '40px';
    avatarContainer.style.borderWidth = '1px';
    avatarContainer.style.borderStyle = 'solid';
    avatarContainer.style.borderColor = 'rgba(255,255,255,0.2)';
    avatarContainer.style.display = 'flex';
    avatarContainer.style.alignItems = 'center';
    avatarContainer.style.justifyContent = 'center';
    avatarContainer.style.background = 'linear-gradient(90deg, #1350FF 0%, #D900FF 100%)';

    avatarContainer.innerHTML = `
        <svg width="16" height="14" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <rect width="20" height="17.561" fill="white" transform="translate(0 0.219513)"/>
                </clipPath>
            </defs>
        </svg>
    `;

    return avatarContainer;
}

// Function to display error messages in the chat UI
function displayErrorMessage(errorType, errorMessage) {
    // Default error message if none provided
    const defaultMessage = "Sorry, there was an error processing your request. Please try again later.";
    const message = errorMessage || defaultMessage;
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'flex items-start gap-2 mb-4';
    
    // Determine styling based on error type
    let bgColor = 'bg-red-50';
    let icon = 'fas fa-exclamation-circle text-red-500';
    
    if (errorType === 'network_error') {
        bgColor = 'bg-yellow-50';
        icon = 'fas fa-wifi-slash text-yellow-600';
    } else if (errorType === 'auth_error') {
        bgColor = 'bg-orange-50';
        icon = 'fas fa-key text-orange-600';
    } else if (errorType === 'rate_limit') {
        bgColor = 'bg-blue-50';
        icon = 'fas fa-clock text-blue-600';
    } else if (errorType === 'validation_error') {
        bgColor = 'bg-purple-50';
        icon = 'fas fa-exclamation-triangle text-purple-600';
    }
    
    errorDiv.innerHTML = `
        <img src="./images/Logo-1.png" alt="Bot" class="h-8 w-8 rounded-full">
        <div class="bot-message max-w-[80%] ${bgColor}">
            <div class="flex items-start">
                <i class="${icon} mr-2 mt-1"></i>
                <div>${message}</div>
            </div>
            <div class="text-xs text-gray-400 mt-1">${getCurrentTime()}</div>
        </div>
    `;
    
    chatMessages.appendChild(errorDiv);
    scrollToBottom();
}

// Enhanced sendMessageToServer function with improved error handling
async function sendMessageToServer(message) {
    // Show typing indicator
    typingIndicator.classList.remove('hidden');
    typingIndicator.classList.add('flex');
    scrollToBottom();
    
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
        try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Hide typing indicator
            typingIndicator.classList.add('hidden');
            typingIndicator.classList.remove('flex');
            
            // Handle different HTTP status codes
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Handle specific error types
                if (response.status === 429) {
                    // Rate limiting
                    const retryAfter = errorData.retryAfter || 60;
                    displayErrorMessage('rate_limit', 
                        `I've received too many requests. Please try again in ${retryAfter} seconds.`);
                    return;
                } else if (response.status === 401) {
                    // Authentication error
                    displayErrorMessage('auth_error', 
                        "I'm having trouble connecting to my knowledge base. Please contact support.");
                    return;
                } else if (response.status === 400) {
                    // Bad request or content filtering
                    displayErrorMessage('content_error', errorData.response || 
                        "I couldn't process that request. Please try a different question.");
                    return;
                } else if (response.status >= 500) {
                    // Server error - might be worth retrying
                    if (retries < maxRetries) {
                        retries++;
                        // Wait before retrying (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                        continue;
                    }
                }
                
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            
            // Add bot response to chat
            const botDiv = document.createElement('div');
            botDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
            
            const botAvatar = createLogoAvatar();
            
            const messageContainer = document.createElement('div');
            messageContainer.className = 'bot-message';
            
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
            
            // Process the response for any special formatting
            postProcessStepLists();
            
            // Render suggested questions if available
            if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
                renderQuestionChips(data.suggestedQuestions);
            }
            
            // Scroll to bottom
            scrollToBottom();
            
            // Success - break out of retry loop
            break;
            
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Hide typing indicator
            typingIndicator.classList.add('hidden');
            typingIndicator.classList.remove('flex');
            
            // Check for specific error types
            if (error.name === 'AbortError') {
                displayErrorMessage('timeout_error', 
                    "The request took too long to complete. Please check your connection and try again.");
            } else if (error.message && error.message.includes('NetworkError')) {
                displayErrorMessage('network_error', 
                    "I'm having trouble connecting to the server. Please check your internet connection.");
            } else if (retries < maxRetries) {
                // If we haven't reached max retries, try again
                retries++;
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                continue;
            } else {
                // We've exhausted retries or it's not a retriable error
                displayErrorMessage('general_error', 
                    "Sorry, I couldn't process your request. Please try again later.");
            }
            
            break;
        }
    }
}

// Usage in sendMessage function
function sendMessage(e) {
    e.preventDefault();
    const message = userInput.value.trim();
    
    // Validate message
    if (!isValidMessage(message)) {
        displayErrorMessage('validation_error', "Please enter a valid message (1-500 characters, no HTML tags).");
        return;
    }
    
    // Rest of the function...
}

// Validation function
function isValidMessage(msg) {
    if (typeof msg !== 'string') return false;
    if (!msg.trim()) return false;
    if (msg.length > 500) return false;
    if (/[<>]/.test(msg)) return false;
    return true;
}
