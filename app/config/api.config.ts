export function getApiUrl(): string {
  const apiUrl = process.env.PYTHON_LLMProvider_API_ENDPOINT || 'http://localhost:8000';
  return apiUrl;
} 