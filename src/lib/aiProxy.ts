export async function sendMessageToProxy(message: string, history: any[] = []) {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const text = await res.text();
    // Try to parse JSON
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || text);
    } catch {
      throw new Error(text || `Request failed with status ${res.status}`);
    }
  }
  const data = await res.json();
  return data.answer;
}
