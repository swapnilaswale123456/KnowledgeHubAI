interface StatusCallbacks {
  onProcessing: (data: any) => void;
  onCompleted: (data: any) => void;
  onError: (data: any) => void;
  onStatusChange: (data: any) => void;
}

export class FileStatusMonitor {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private callbacks: StatusCallbacks = {
    onProcessing: () => {},
    onCompleted: () => {},
    onError: () => {},
    onStatusChange: () => {}
  };

  constructor(private chatbotId: string) {
    console.log(`Initializing FileStatusMonitor for chatbot: ${chatbotId}`);
  }

  startMonitoring() {
    try {
      const baseUrl = 'http://localhost:5000';
      const url = `${baseUrl}/api/v1/files/status/${this.chatbotId}/stream`;
      console.log(`Connecting to SSE endpoint: ${url}`);
      
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource(url, {
        withCredentials: true
      });

      this.eventSource.onopen = () => {
        console.log('SSE Connection opened successfully');
        this.reconnectAttempts = 0; // Reset on successful connection
      };

      this.eventSource.addEventListener('status', (event: MessageEvent) => {
        console.log('Raw status event received:', event);
        
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed status data:', data);
          
          if (data.type === 'connection') {
            console.log('Connection established:', data);
            return;
          }

          this.callbacks.onStatusChange(data);

          switch (data.status) {
            case 'processing':
              console.log('Processing status received:', data);
              this.callbacks.onProcessing(data);
              break;
            case 'completed':
              console.log('Completion status received:', data);
              this.callbacks.onCompleted(data);
              this.stopMonitoring();
              break;
            case 'error':
              console.log('Error status received:', data);
              this.callbacks.onError(data);
              this.stopMonitoring();
              break;
          }
        } catch (error) {
          console.error('Error parsing status event:', error, 'Raw data:', event.data);
        }
      });

      this.eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        } else {
          console.error('Max reconnection attempts reached');
          this.stopMonitoring();
        }
      };

    } catch (error) {
      console.error('Error starting monitor:', error);
    }
  }

  private reconnect() {
    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    setTimeout(() => {
      this.startMonitoring();
    }, 1000);
  }

  stopMonitoring() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('Monitoring stopped');
    }
  }

  on(event: keyof StatusCallbacks, callback: (data: any) => void) {
    if (event in this.callbacks) {
      this.callbacks[event] = callback;
    }
  }
}