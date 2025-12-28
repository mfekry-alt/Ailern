import axios from 'axios';

// NOTE: For production, do NOT ship API keys in client code.
// Prefer moving this call behind your own backend.
const GEMINI_API_KEY = 'AIzaSyB4JP4PaF3Ycr1gAKFRwIn1n2FqcKBiuYU';

// This model name is confirmed available for `generateContent` on v1beta.
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
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
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const response = await axios.post<GeminiResponse>(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          ...history,
          {
            parts: [{ text: message }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      return response.data.candidates[0].content.parts[0].text;
    }

    throw new Error('Invalid response from Gemini API');
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;
      const errorMsg = errorData?.error?.message || error.message;
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: errorData,
      });
      
      // Provide helpful error message
      if (error.response?.status === 400) {
        throw new Error('API configuration error. Please check the API key and ensure the Gemini API is enabled in Google Cloud Console.');
      } else if (error.response?.status === 403) {
        throw new Error('API key is invalid or has insufficient permissions. Please verify your API key.');
      } else if (error.response?.status === 429) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      
      throw new Error(errorMsg);
    }
    throw new Error('Failed to connect to AI service');
  }
};
