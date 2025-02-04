import { WS_CONFIG, getWebSocketUrl } from '~/config/websocket.config';

type MessageHandler = (data: any) => void;
type ConnectionStateHandler = (connected: boolean) => void;

interface WebSocketMessage {
  type: string;
  content: string | null;
  chatbot_id?: string;
  user_id?: string;
  session_id?: string;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionStateHandlers: Set<ConnectionStateHandler> = new Set();
  private intentionalClose = false;

  constructor(private chatbotId: string) {}

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
    console.log('WebSocket connection in progress');
    return;
    }

    this.intentionalClose = false;
    
    try {
      const wsUrl = getWebSocketUrl(this.chatbotId);
      this.ws = new WebSocket(wsUrl);
      console.log('Connecting to WebSocket:', wsUrl);

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          this.ws?.close();
        }
      }, WS_CONFIG.CONNECTION_TIMEOUT);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnection();
    }
  }

  private handleOpen() {
    console.log('WebSocket connected');
    this.clearConnectionTimeout();
    this.reconnectAttempts = 0;
    this.notifyConnectionState(true);
    //this.startPingInterval();
  }

  private handleMessage(event: MessageEvent) {
    try {
      console.log('Raw WebSocket message:', event.data);
      let parsedData;
      
      try {
        parsedData = JSON.parse(event.data);
      } catch (e) {
        // If not JSON, treat as plain text
        parsedData = { content: event.data, type: 'text' };
      }

      if (parsedData.type === 'pong') {
        return;
      }

      // Normalize the response structure
      let messageContent;
      if (typeof parsedData === 'string') {
        messageContent = { content: parsedData, type: 'text' };
      } else if (parsedData.answer) {
        messageContent = { content: parsedData.answer, type: 'text' };
      } else if (parsedData.response) {
        messageContent = { content: parsedData.response, type: 'text' };
      } else if (parsedData.content) {
        messageContent = parsedData;
      } else {
        messageContent = { content: JSON.stringify(parsedData), type: 'text' };
      }

      console.log('Processed message content:', messageContent);
      this.messageHandlers.forEach(handler => handler(messageContent));
    } catch (error) {
      console.error('Error handling message:', error, event.data);
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket closed:', event.code, event.reason);
    this.cleanup();
    this.notifyConnectionState(false);

    if (!this.intentionalClose) {
      this.handleReconnection();
    }
  }

  private handleError(event: Event) {
    console.error('WebSocket error:', event);
    this.cleanup();
    this.notifyConnectionState(false);
  }

  private handleReconnection() {
    if (this.intentionalClose || this.reconnectAttempts >= WS_CONFIG.RETRY.MAX_ATTEMPTS) {
      console.log('Max reconnection attempts reached or intentional close');
      return;
    }

    const delay = Math.min(
      WS_CONFIG.RETRY.INITIAL_DELAY * Math.pow(WS_CONFIG.RETRY.BACKOFF_FACTOR, this.reconnectAttempts),
      WS_CONFIG.RETRY.MAX_DELAY
    );

    console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${WS_CONFIG.RETRY.MAX_ATTEMPTS}) in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.sendMessage({ type: 'ping', content: null });
        }
      }, WS_CONFIG.PING_INTERVAL);
  }

  private cleanup() {
    this.clearConnectionTimeout();
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const payload = {
        ...message,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  addMessageHandler(handler: MessageHandler) {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers.delete(handler);
  }

  private notifyConnectionState(connected: boolean) {
    this.connectionStateHandlers.forEach(handler => handler(connected));
  }

  addConnectionStateHandler(handler: ConnectionStateHandler) {
    this.connectionStateHandlers.add(handler);
  }

  removeConnectionStateHandler(handler: ConnectionStateHandler) {
    this.connectionStateHandlers.delete(handler);
  }

  disconnect() {
    this.intentionalClose = true;
    this.cleanup();
    if (this.ws) {
      this.ws.close(WS_CONFIG.CLOSE_CODES.NORMAL);
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.connectionStateHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
} 
