export const WS_CONFIG = {
  RETRY: {
    MAX_ATTEMPTS: 5,
    INITIAL_DELAY: 1000,
    MAX_DELAY: 30000,
    BACKOFF_FACTOR: 1.5
  },
  PING_INTERVAL: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  CLOSE_CODES: {
    NORMAL: 1000,
    GOING_AWAY: 1001,
    PROTOCOL_ERROR: 1002,
    ABNORMAL_CLOSURE: 1006
  }
};

export function getWebSocketUrl(chatbotId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = process.env.NODE_ENV === 'production' ? '' : ':8000';
  return `${protocol}//${host}${port}/ws/chat/${chatbotId}`;
} 