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
