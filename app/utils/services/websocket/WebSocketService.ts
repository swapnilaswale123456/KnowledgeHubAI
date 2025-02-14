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
  private userId: string = "user"; // Default user ID

  constructor(
    private chatbotId: string, 
    private sessionId?: string
  ) {}

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
      // Construct WebSocket URL with query parameters
      const baseUrl = getWebSocketUrl(this.chatbotId);     
      const params = new URLSearchParams({
        user_id: this.userId,
        session_id: this.sessionId || '' // Always include session_id
      });
      const wsUrl = `${baseUrl}?${params.toString()}`;
      
      console.log('Step 1: Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      console.log('Step 2: WebSocket instance created');

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          this.ws?.close();
        }
      }, WS_CONFIG.CONNECTION_TIMEOUT);

      // Ensure proper binding of event handlers
      this.ws.onmessage = (event) => {
        console.log('Step 3: Message received, calling handler');
        this.handleMessage(event);
      };
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Log connection status
      console.log('WebSocket handlers attached');
    } catch (error) {
      console.error('Connection failed:', error);
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
      if (!event.data) {
        console.warn('Received empty message data');
        return;
      }

      console.log('Step 1: Raw WebSocket message received:', event.data);
      
      // Parse the raw message first
      const rawMessage = JSON.parse(event.data);
      if (!rawMessage) {
        console.warn('Failed to parse message data');
        return;
      }

      console.log('Step 2: Parsed raw message:', rawMessage);
      console.log('Current handlers count:', this.messageHandlers.size);
      
      // Call handlers with raw message if no content
      if (!rawMessage.content) {
        if (this.messageHandlers.size > 0) {
          for (const handler of this.messageHandlers) {
            handler(rawMessage);
          }
        }
        return;
      }

      // If content is JSON string, parse it
      if (typeof rawMessage.content === 'string' && rawMessage.content.includes('```json')) {
        const contentStr = rawMessage.content.replace(/^```json\s*|\s*```$/g, '');
        try {
          const parsedContent = JSON.parse(contentStr);
          // Construct final message object
          const finalMessage = {
            type: rawMessage.type,
            session_id: rawMessage.session_id,
            content: parsedContent.response || parsedContent.content || parsedContent.answer || parsedContent.message || ''
          };
          console.log('Step 3: Final processed message:', finalMessage);
          
          // Call each handler directly
          if (this.messageHandlers.size > 0) {
            for (const handler of this.messageHandlers) {
              try {
                console.log('Step 4: Calling handler directly');
                handler(finalMessage);
                console.log('Step 5: Handler called successfully');
              } catch (error) {
                console.error('Handler execution error:', error);
              }
            }
          } else {
            console.warn('No message handlers registered');
          }
        } catch (contentError) {
          console.error('Content parsing error:', contentError);
          // Fall back to raw message
          for (const handler of this.messageHandlers) {
            handler(rawMessage);
          }
        }
      } else {
        // Handle plain messages
        for (const handler of this.messageHandlers) {
          handler(rawMessage);
        }
      }
    } catch (error) {
      console.error('Message parsing error:', error);
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
    if (!handler) {
      console.error('Attempted to add null handler');
      return;
    }
    console.log('Adding new message handler');
    this.messageHandlers.add(handler);
    console.log('Updated handlers count:', this.messageHandlers.size);
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
    this.connectionStateHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  updateSessionId(sessionId: string) {
    if (this.sessionId === sessionId) return;
    
    console.log('Updating WebSocket session:', sessionId);
    this.sessionId = sessionId;
    
    // Store current handlers
    const currentHandlers = new Set(this.messageHandlers);
    
    // Disconnect and reconnect
    this.disconnect();
    
    // Restore handlers
    this.messageHandlers = currentHandlers;
    
    this.connect();
  }

  private logHandlers() {
    console.log('Current handlers:', {
      count: this.messageHandlers.size,
      handlers: Array.from(this.messageHandlers).map(h => h.name || 'anonymous')
    });
  }
} 
