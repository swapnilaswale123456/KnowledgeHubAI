export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private messageHandlers: ((data: any) => void)[] = [];

  constructor(private chatbotId: string) {}

  connect() {
    try {
      // Connect to Python WebSocket server
      const wsUrl = `ws://localhost:8000/ws/chat/${this.chatbotId}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        // Send initial connection message
        this.sendMessage({
          type: 'init',
          chatbot_id: this.chatbotId // Using snake_case for Python
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnection();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnection();
    }
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectTimeout * this.reconnectAttempts);
    }
  }

  sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // Convert to snake_case for Python backend
      const pythonMessage = {
        ...message,
        chatbot_id: this.chatbotId,
        message_type: message.type,
      };
      this.ws.send(JSON.stringify(pythonMessage));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  addMessageHandler(handler: (data: any) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (data: any) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 