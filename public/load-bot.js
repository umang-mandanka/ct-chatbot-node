(function () {
  // Prevent double-inject
  if (window.__CT_CHATBOT_LOADED) return;
  window.__CT_CHATBOT_LOADED = true;

  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'chatbot-iframe';
  iframe.src = 'http://localhost:3000/';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '24px';
  iframe.style.right = '24px';
  // Set transition before width/height for smooth initial render (using 0.4s to match chat-custom.css)
  iframe.style.transition = 'none';
  iframe.style.width = '64px'; // Minimized/icon state by default
  iframe.style.height = '64px'; // Minimized/icon state by default
  iframe.style.border = 'none';
  iframe.style.borderRadius = '50%';
  iframe.style.zIndex = '9999';
  iframe.style.background = 'transparent';
  iframe.allow = 'clipboard-write';
  iframe.title = 'Chatbot';
  document.body.appendChild(iframe);

  // Parent-side resize handler
  window.addEventListener('message', function (event) {
    if (event.data?.type === 'chatbot-resize') {
      const iframe = document.getElementById('chatbot-iframe');
      if (!iframe) return;

      // Apply transition property first
      iframe.style.transition = 'none';

      // Debug: log received event
      console.log('[Chatbot Iframe] Received resize event:', event.data);
      requestAnimationFrame(() => {
        let targetWidth, targetHeight, targetRadius, targetZ;
        if (event.data.state === 'maximized' || event.data.state === 'open') {
          targetWidth = '100vw';
          targetHeight = '100vh';
          targetRadius = '16px';
          targetZ = '10000';
          targetBottom = '24px';
          targetRight = '24px';
        } else {
          targetWidth = '64px';
          targetHeight = '64px';
          targetRadius = '50%';
          targetZ = '9999';
          targetBottom = '24px';
          targetRight = '24px';
        }
        // Defensive: never set to 0px
        if (targetWidth !== '0px' && targetHeight !== '0px') {
          // Force reflow before changing size
          void iframe.offsetWidth;
          console.log('[Chatbot Iframe] Before resize:', {
            width: iframe.style.width,
            height: iframe.style.height,
            bottom: iframe.style.bottom,
            right: iframe.style.right,
            state: event.data.state
          });
          iframe.style.width = targetWidth;
          iframe.style.height = targetHeight;
          iframe.style.borderRadius = targetRadius;
          iframe.style.zIndex = targetZ;
          iframe.style.bottom = targetBottom;
          iframe.style.right = targetRight;
          // Log after a short delay to catch the new value
          setTimeout(() => {
            console.log('[Chatbot Iframe] After resize:', {
              width: iframe.style.width,
              height: iframe.style.height,
              bottom: iframe.style.bottom,
              right: iframe.style.right,
              state: event.data.state
            });
          }, 50);
        }
      });
    }
  });
})();
