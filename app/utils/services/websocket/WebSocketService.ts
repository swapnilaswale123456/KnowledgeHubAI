export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private messageHandlers: ((data: any) => void)[] = [];
  private connectionStateHandlers: ((connected: boolean) => void)[] = [];

  constructor(private chatbotId: string) {}

  connect() {
    try {
      // Connect to Python WebSocket server with chatbot ID
      const wsUrl = `ws://localhost:8000/ws/chat/${this.chatbotId}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyConnectionState(true);
      };

      this.ws.onmessage = (event) => {
        try {
          // Parse the response if it's a string
          const data = event.data;
          console.log('Received message:', data); // Debug log
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error handling message:', error, event.data);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.notifyConnectionState(false);
        this.handleReconnection();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyConnectionState(false);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.notifyConnectionState(false);
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
      const payload = {
        ...message,
        chatbot_id: this.chatbotId
      };
      console.log('Sending message:', payload); // Debug log
      this.ws.send(JSON.stringify(payload));
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

  private notifyConnectionState(connected: boolean) {
    this.connectionStateHandlers.forEach(handler => handler(connected));
  }

  addConnectionStateHandler(handler: (connected: boolean) => void) {
    this.connectionStateHandlers.push(handler);
  }

  removeConnectionStateHandler(handler: (connected: boolean) => void) {
    this.connectionStateHandlers = this.connectionStateHandlers.filter(h => h !== handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
} 