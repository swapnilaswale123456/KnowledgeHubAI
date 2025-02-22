(function() {
  // Create widget container
  const container = document.createElement('div');
  container.id = 'chatbot-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '9999';
  
  // Get configuration
  const config = window.chatbotConfig || {};
  const position = config.position || 'bottom-right';
  const chatbotId = config.chatbotId;
  const uniqueUrl = config.uniqueUrl;
  
  if (!chatbotId || !uniqueUrl) {
    console.error('Chatbot ID and uniqueUrl are required');
    return;
  }

  // Create iframe using existing route
  const iframe = document.createElement('iframe');
  iframe.src = `${window.location.origin}/app/${uniqueUrl}/g/chatbot/${chatbotId}?embedded=true`;
  iframe.style.width = '400px';
  iframe.style.height = '600px';
  iframe.style.border = '1px solid #eee';
  iframe.style.borderRadius = '10px';
  iframe.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  iframe.style.display = 'none';
  
  // Create toggle button
  const button = document.createElement('button');
  button.innerHTML = '💬';
  button.style.padding = '15px';
  button.style.borderRadius = '50%';
  button.style.border = 'none';
  button.style.backgroundColor = '#0084ff';
  button.style.color = 'white';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  
  button.onclick = () => {
    if (iframe.style.display === 'none') {
      iframe.style.display = 'block';
      button.innerHTML = '✕';
    } else {
      iframe.style.display = 'none';
      button.innerHTML = '💬';
    }
  };

  // Add elements to container
  container.appendChild(iframe);
  container.appendChild(button);
  
  // Add container to page
  document.body.appendChild(container);
})(); 