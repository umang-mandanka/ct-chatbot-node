// Chat Input Bar Expansion and Chatbox Handling

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const chatInputBar = document.getElementById('chat-input-bar');
    const chatbarInput = document.getElementById('chatbar-input');
    const chatbox = document.getElementById('chatbox');
    const chatbarForm = document.getElementById('chatbar-form');
    const closeChat = document.getElementById('close-chat');
    
    // Function to expand input and show chatbox
    function expandInputAndShowChat() {
        // Expand the input bar
        chatInputBar.classList.add('expanded');
        
        // Show the chatbox
        chatbox.classList.remove('hidden');
        chatbox.classList.add('visible');
        
        // Focus the input
        chatbarInput.focus();
    }
    
    // Function to collapse input and hide chatbox
    function collapseInputAndHideChat() {
        // Only collapse if clicked outside the chatbox and input bar
        chatInputBar.classList.remove('expanded');
        
        // Hide the chatbox
        chatbox.classList.remove('visible');
        setTimeout(() => {
            chatbox.classList.add('hidden');
        }, 300); // Match transition duration
    }
    
    // Event listener for input field click
    chatbarInput.addEventListener('click', function(e) {
        expandInputAndShowChat();
        e.stopPropagation(); // Prevent event from bubbling up
    });
    
    // Event listener for input field focus
    chatbarInput.addEventListener('focus', function(e) {
        expandInputAndShowChat();
        e.stopPropagation(); // Prevent event from bubbling up
    });
    
    // Event listener for form click
    chatbarForm.addEventListener('click', function(e) {
        expandInputAndShowChat();
        e.stopPropagation(); // Prevent event from bubbling up
    });
    
    // Event listener for chatbox click
    chatbox.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling up
    });
    
    // Event listener for close button
    if (closeChat) {
        closeChat.addEventListener('click', function() {
            collapseInputAndHideChat();
        });
    }
    
    // Event listener for document click (to close chatbox when clicking outside)
    document.addEventListener('click', function(e) {
        // Check if the click was outside the chatbox and input bar
        if (!chatbox.contains(e.target) && !chatInputBar.contains(e.target)) {
            collapseInputAndHideChat();
        }
    });
    
    // Handle form submission
    chatbarForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = chatbarInput.value.trim();
        if (message) {
            // Make sure the chatbox is visible
            expandInputAndShowChat();
            
            // Add user message to chat
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                // Create user message element - styled like bot message but without avatar
                const userMessageDiv = document.createElement('div');
                userMessageDiv.className = 'flex justify-end mb-4 animate-fade-in';
                
                const messageContainer = document.createElement('div');
                messageContainer.className = 'user-message'; // Keep the class name
                
                const messageContent = document.createElement('div');
                messageContent.textContent = message;
                messageContent.style.width = '100%'; // Ensure content takes full width in flexbox
                
                messageContainer.appendChild(messageContent);
                
                userMessageDiv.appendChild(messageContainer);
                chatMessages.appendChild(userMessageDiv);
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Show typing indicator
                const typingIndicator = document.getElementById('typing-indicator');
                if (typingIndicator) {
                    typingIndicator.classList.remove('hidden');
                    typingIndicator.classList.add('flex');
                }
                
                // Send to server
                // Use the global sendMessageToServer function if available
                if (typeof window.sendMessageToServer === 'function') {
                    window.sendMessageToServer(message);
                } else {
                    // Fallback implementation
                    fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ message: message })
                    })
                    .then(response => response.json())
                    .then(data => {
                        // Hide typing indicator
                        if (typingIndicator) {
                            typingIndicator.classList.add('hidden');
                            typingIndicator.classList.remove('flex');
                        }
                        
                        // Add bot response
                        if (data.message) {
                            // Create bot message element
                            const botMessageDiv = document.createElement('div');
                            botMessageDiv.className = 'flex items-start gap-2 mb-4 animate-fade-in';
                            
                            // Create bot avatar
                            const botAvatar = document.createElement('div');
                            botAvatar.style = 'width: 32px; height: 32px; border-radius: 40px; border-width: 1px; border-style: solid; border-color: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; background: linear-gradient(90deg, #1350FF 0%, #D900FF 100%);';
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
                            
                            const messageContainer = document.createElement('div');
                            messageContainer.className = 'bot-message';
                            
                            const messageContent = document.createElement('div');
                            messageContent.innerHTML = data.message;
                            messageContent.style.width = '100%'; // Ensure content takes full width in flexbox
                            
                            messageContainer.appendChild(messageContent);
                            
                            botMessageDiv.appendChild(botAvatar);
                            botMessageDiv.appendChild(messageContainer);
                            chatMessages.appendChild(botMessageDiv);
                            
                            // Scroll to bottom
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        // Hide typing indicator
                        if (typingIndicator) {
                            typingIndicator.classList.add('hidden');
                            typingIndicator.classList.remove('flex');
                        }
                    });
                }
            }
            
            // Clear the input field
            chatbarInput.value = '';
        }
    });
    
    // Prevent any existing maximize/minimize functionality
    const existingMaximizeBtn = document.getElementById('maximize-chat');
    if (existingMaximizeBtn) {
        existingMaximizeBtn.style.display = 'none';
    }
});
