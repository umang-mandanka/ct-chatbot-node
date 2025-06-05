(function () {
  // Prevent double-inject
  if (window.__CT_CHATBOT_LOADED) return;
  window.__CT_CHATBOT_LOADED = true;

  // Create the container div
  const container = document.createElement('div');
  container.id = 'chatbot-container';
  container.style.position = 'fixed';
  container.style.left = '50%';
  container.style.bottom = '24px';
  container.style.transform = 'translateX(-50%)';
  container.style.zIndex = '9999';
  container.style.margin = '0';
  container.style.padding = '0';
  container.style.pointerEvents = 'auto';
  container.style.cursor = 'pointer';
  container.style.background = 'transparent';
  container.style.transition = 'all 0.3s ease';
  document.body.appendChild(container);

  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'chatbot-iframe';
  iframe.src = 'http://localhost:3000/'; // Replace with production URL
  iframe.style.width = '337px';
  iframe.style.height = '48px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '44px';
  iframe.style.pointerEvents = 'auto';
  iframe.style.background = 'transparent';
  iframe.allow = 'clipboard-write';
  iframe.title = 'Chatbot';
  iframe.style.transition = 'width 0.3s ease, height 0.3s ease, border-radius 0.3s ease';

  container.appendChild(iframe);

  function expandIframe() {
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.borderRadius = '0px';
    container.style.left = '0';
    container.style.bottom = '0';
    container.style.transform = 'none';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.cursor = '';
    window.__CT_CHATBOT_EXPANDED = true;
  }

  function minimizeIframe() {
    iframe.style.width = '337px';
    iframe.style.height = '48px';
    iframe.style.borderRadius = '44px';
    container.style.left = '50%';
    container.style.bottom = '24px';
    container.style.transform = 'translateX(-50%)';
    container.style.width = '';
    container.style.height = '';
    container.style.cursor = 'pointer';
    window.__CT_CHATBOT_EXPANDED = false;
    hasNotifiedIframe = false;
  }

  // Listen for resize messages
  window.addEventListener('message', function (event) {
    console.log('[Chatbot loader] Received message from iframe:', event.data);
    if (event.data && event.data.type === 'chatbot-resize') {
      if (event.data.state === 'open' || event.data.state === 'maximized') {
        expandIframe();
      } else if (event.data.state === 'closed' || event.data.state === 'minimized') {
        minimizeIframe();
      }
    }
  });

  // Notify iframe after transition
  let hasNotifiedIframe = false;
  iframe.addEventListener('transitionend', function (e) {
    console.log('[Chatbot loader] iframe transitionend:', e.propertyName, 'Current size:', iframe.style.width, iframe.style.height);
    if (e.propertyName === 'width' && window.__CT_CHATBOT_EXPANDED && !hasNotifiedIframe) {
      if (iframe.style.width === '100vw') {
        hasNotifiedIframe = true;
        iframe.contentWindow.postMessage({ type: 'chatbot-iframe-expanded' }, '*');
        console.log('[Chatbot loader] Sent chatbot-iframe-expanded to iframe');
      }
    }
  });

})();
