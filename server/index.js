require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// Load simple local knowledge base (markdown files in ./knowledge)
const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');
let knowledge = [];
if (fs.existsSync(KNOWLEDGE_DIR)) {
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
  knowledge = files.map((file) => ({
    id: file,
    text: fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf8'),
  }));
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: process.env.GEMINI_API_KEY ? 'proxy' : 'local-fallback' });
});

app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      // Build system context from knowledge base
      const systemContext =
        knowledge.length > 0
          ? `You are an AI assistant for Ailern, a Learning Management System. Use this knowledge to answer questions:\n\n${knowledge.map((k) => `${k.id}:\n${k.text.slice(0, 2000)}`).join('\n\n---\n\n')}`
          : 'You are an AI assistant for Ailern LMS. Answer questions about courses, lessons, users, and system features.';

      // Build contents with system context + history + current message
      const contents = [];

      // Add system context as first user message if no history
      if (!history || history.length === 0) {
        contents.push({
          role: 'user',
          parts: [{ text: systemContext }],
        });
        contents.push({
          role: 'model',
          parts: [
            {
              text: 'I understand. I am an AI assistant for Ailern LMS and will help answer questions based on the provided knowledge.',
            },
          ],
        });
      }

      // Add conversation history
      contents.push(
        ...(history || []).slice(-8).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))
      );

      // Add current message with context reminder
      contents.push({
        role: 'user',
        parts: [
          {
            text: `${message}\n\n(Remember: Answer based on Ailern LMS knowledge provided earlier)`,
          },
        ],
      });

      const model = process.env.GEMINI_MODEL || 'models/gemini-flash-latest';
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;

      const resp = await axios.post(
        url,
        { contents },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return res.status(500).json({ error: 'Invalid response from Gemini' });
      return res.json({ answer: text });
    } catch (err) {
      console.error('Gemini proxy error:', err?.response?.data || err.message || err);
      const status = err?.response?.status || 500;
      const msg = err?.response?.data?.error?.message || err.message || 'Upstream error';
      return res.status(status).json({ error: msg });
    }
  }

  // Local fallback: naive keyword match against knowledge files
  try {
    if (!knowledge.length) {
      return res.json({
        answer: `I don't have knowledge loaded. Add markdown files to server/knowledge.`,
      });
    }
    const query = (message || '').toLowerCase();
    // Score docs by count of matching words
    const words = query.split(/\W+/).filter(Boolean);
    const scores = knowledge.map((doc) => {
      const text = doc.text.toLowerCase();
      let score = 0;
      for (const w of words) if (text.includes(w)) score += 1;
      return { doc, score };
    });
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    if (!best || best.score === 0) {
      return res.json({ answer: "Sorry, I don't know that yet. (Local fallback)" });
    }
    // Return the first 800 chars as an excerpt
    const excerpt = best.doc.text.slice(0, 800);
    return res.json({ answer: `From ${best.doc.id}:\n\n${excerpt}` });
  } catch (err) {
    console.error('Local fallback error:', err);
    return res.status(500).json({ error: 'Local fallback failed' });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy listening on http://localhost:${PORT}`);
});
