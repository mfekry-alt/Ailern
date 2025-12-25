# Ailern AI Proxy Server

This server acts as a secure proxy between the frontend and Google Gemini API, protecting your API key from exposure in client-side code.

## Features

- **Secure API Key Management**: API key stored server-side only
- **Gemini Integration**: Forwards chat requests to Google Gemini API
- **Local Knowledge Fallback**: Uses simple keyword search on local markdown files when API key is not available
- **CORS Enabled**: Configured to work with frontend on localhost:5173

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your Gemini API key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=models/gemini-flash-latest
PORT=3001
```

Get your API key from: https://makersuite.google.com/app/apikey

### 3. Add Knowledge Files (Optional)

Add markdown files to `knowledge/` directory. These are used for local fallback when API key is not set:

```bash
# Example structure
knowledge/
├── company-overview.md
├── product-features.md
└── faq.md
```

### 4. Start Server

```bash
npm start
```

Server will start on http://localhost:3001

## API Endpoints

### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "ok": true,
  "mode": "proxy" // or "local-fallback"
}
```

### `POST /api/ai/chat`

Send a message to the AI assistant.

**Request:**

```json
{
  "message": "Hello, how can you help?",
  "history": [
    {
      "role": "user",
      "content": "Previous message",
      "timestamp": "2025-12-25T..."
    }
  ]
}
```

**Response (Success):**

```json
{
  "answer": "I can help you with..."
}
```

**Response (Error):**

```json
{
  "error": "Error message"
}
```

## How It Works

### With Gemini API Key

1. Receives chat request from frontend
2. Formats conversation history + new message
3. Forwards to Google Gemini API
4. Returns AI-generated response

### Without API Key (Fallback)

1. Receives chat request
2. Searches local markdown files in `knowledge/`
3. Scores files by keyword matches
4. Returns excerpt from best-matching file

## Security Notes

- **Never commit `.env` file** - it contains your API key
- API key is stored server-side only
- Frontend calls this proxy, not Gemini directly
- CORS is configured for localhost development

## Production Deployment

For production:

1. Set environment variables in your hosting platform
2. Update CORS origin in `index.js` to your production domain
3. Enable HTTPS
4. Consider adding authentication to the `/api/ai/chat` endpoint
5. Add rate limiting to prevent abuse
6. Monitor API usage and costs

## Troubleshooting

**"Failed to fetch" in frontend:**

- Ensure server is running (`npm start`)
- Check server logs for errors
- Verify frontend Vite proxy is configured (see `vite.config.ts`)
- Confirm port 3001 is available

**Gemini API errors:**

- Verify API key is correct
- Check Google Cloud Console that Generative Language API is enabled
- Review quota limits
- Check server logs for detailed error messages

**Local fallback not working:**

- Add `.md` files to `knowledge/` directory
- Check file permissions
- Review server logs

## Development

Run in watch mode (auto-restart on changes):

```bash
npx nodemon index.js
```

Test the API:

```bash
# Health check
curl http://localhost:3001/api/health

# Chat request
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is Ailern?"}'
```
