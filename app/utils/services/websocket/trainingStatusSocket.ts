import { getTrainingWebSocketUrl } from "~/config/websocket.config";

export class TrainingStatusSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private pingInterval: NodeJS.Timeout | null = null;
  private chatbotId: string | null = null;
  private connected = false;

  constructor(chatbotId: string) {
    this.chatbotId = chatbotId;
    this.ws = null;
    this.pingInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(`ws://localhost:8000/ws/status/${this.chatbotId}`);

    this.ws.onopen = () => {
        console.log('Status WebSocket Connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        switch (data.type) {
            case 'connected':
                console.log('Connection confirmed');
                break;
            case 'pong':
                console.log('Received pong');
                break;
            case 'status':
                this.handleStatusUpdate(data);
                break;
        }
    };

    this.ws.onclose = () => {
        console.log('Status WebSocket Disconnected');
        this.stopPingInterval();
        this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
}

  startPingInterval() {
      // Clear any existing interval
      this.stopPingInterval();
      
      // Start new ping interval
      this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({
                  type: 'ping',
                  chatbot_id: this.chatbotId,
                  timestamp: new Date().toISOString()
              }));
          }
      }, 30000); // Send ping every 30 seconds
  }

  stopPingInterval() {
      if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
      }
  }

  attemptReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
              this.connect();
          }, 5000); // Wait 5 seconds before reconnecting
      } else {
          console.log('Max reconnection attempts reached');
      }
  }

  handleStatusUpdate(data: any) {
      console.log('Status Update:', data);
      // Handle different status types
      switch (data.status) {
          case 'processing':
              console.log('File is being processed:', data.message);
              break;
          case 'completed':
              console.log('Processing completed:', data.message);
              break;
          case 'error':
              console.error('Processing error:', data.message);
              break;
      }
  }

  disconnect() {
      this.stopPingInterval();
      if (this.ws) {
          this.ws.close();
      }
    }

} 