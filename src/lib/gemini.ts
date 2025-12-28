// src/lib/gemini.ts
import axios from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export const sendMessageToGemini = async (
  message: string,
  _conversationHistory: ChatMessage[] = []
): Promise<string> => {
  try {
    const history = _conversationHistory
      .slice(-10)
      .map((msg) => ({
        parts: [{ text: msg.content }],
      }));

    // هنا بنكلم الملف اللي عملناه في مجلد api
    // لاحظ إننا مش بنكتب https://... بنكتب المسار بس
    const response = await axios.post<GeminiResponse>('/api/gemini', {
      contents: [
        ...history,
        {
          parts: [{ text: message }],
        },
      ],
    });

    if (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      return response.data.candidates[0].content.parts[0].text;
    }

    throw new Error('Invalid response from Gemini API');
  } catch (error) {
    console.error('Error calling internal API:', error);
    if (axios.isAxiosError(error)) {
      const errorMsg = error.response?.data?.error || error.message;
      throw new Error(errorMsg);
    }
    throw new Error('Failed to connect to AI service');
  }
};

