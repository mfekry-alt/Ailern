export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function sendMessageToProxy(message: string, history: ChatMessage[] = []) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const res = await fetch('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      // Try to parse JSON for error message
      try {
        const json = JSON.parse(text);
        throw new Error(json.error || text);
      } catch (parseError) {
        throw new Error(text || `Server error: ${res.status}`);
      }
    }

    const data = await res.json();
    return data.answer;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server took too long to respond');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to connect to AI service');
  }
}
