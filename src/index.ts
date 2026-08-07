import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { config } from './config.js';
import { processFile } from './ingest.js';
import { appGraph } from './agent/graph.js';

const app = express();
const port = config.port;

app.use(cors());
app.use(express.json());

// Configure multer for memory storage (for MVP)
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), async (req, res): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { buffer, mimetype, originalname } = req.file;
    console.log(`Processing file: ${originalname}`);
    
    const chunks = await processFile(buffer, mimetype, originalname);
    
    res.json({ message: 'File successfully ingested', chunks });
  } catch (error: any) {
    console.error('Error during ingestion:', error);
    res.status(500).json({ error: error.message || 'Internal server error during ingestion' });
  }
});

app.post('/api/chat', async (req, res): Promise<any> => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Flush the headers immediately
    res.flushHeaders();

    console.log(`Starting LangGraph for question: "${question}"`);
    const initialState = { question, documents: [], answer: '' };
    
    // Stream events
    const stream = await appGraph.streamEvents(initialState, { version: 'v2' });
    
    for await (const event of stream) {
      if (event.event === 'on_chain_start') {
        // Filter for specific node starts
        if (['retrieve', 'gradeDocuments', 'generate', 'rewrite'].includes(event.name)) {
          res.write(`event: progress\ndata: ${JSON.stringify({ step: event.name })}\n\n`);
        }
      } else if (event.event === 'on_chat_model_stream') {
        const chunk = event.data?.chunk;
        if (chunk && chunk.content) {
          res.write(`event: token\ndata: ${JSON.stringify({ token: chunk.content })}\n\n`);
        }
      } else if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
        // Send metadata at the end of the entire graph
        const finalState = event.data?.output;
        if (finalState && finalState.documents) {
          const usedDocuments = finalState.documents.map((d: any) => d.metadata);
          res.write(`event: metadata\ndata: ${JSON.stringify({ usedDocuments })}\n\n`);
        }
      }
    }
    
    res.write(`event: end\ndata: {}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error during chat:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal server error during chat' });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

app.listen(port, () => {
  console.log(`RAG MVP server running on port ${port}`);
});
