import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { config } from './config.js';
import { processFile } from './ingest.js';
import { appGraph } from './agent/graph.js';
import { ingestionGraph, checkpointer } from './agent/ingestionGraph.js';
import { v4 as uuidv4 } from 'uuid';
const app = express();
const port = config.port;

app.use(cors());
app.use(express.json());

// Configure multer for memory storage (for MVP)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- New LangGraph Ingestion Routes ---
app.post('/ingest/start', upload.single('file'), async (req, res): Promise<any> => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const thread_id = uuidv4();
    const config = { configurable: { thread_id } };
    
    // Initialize the state
    const { buffer, mimetype, originalname } = req.file;
    await ingestionGraph.invoke(
      { fileBuffer: buffer, fileName: originalname, mimeType: mimetype },
      config
    );

    res.json({ message: 'Ingestion started, waiting for review', thread_id });
  } catch (error: any) {
    console.error('Error starting ingestion:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/ingest/status/:thread_id', async (req, res): Promise<any> => {
  try {
    const thread_id = req.params.thread_id;
    const config = { configurable: { thread_id } };
    
    const state = await ingestionGraph.getState(config);
    if (!state || !state.values) {
      return res.status(404).json({ error: 'Thread not found or no state available' });
    }

    res.json({
      status: state.values.reviewStatus,
      fileName: state.values.fileName,
      extractedMarkdown: state.values.extractedMarkdown,
      next: state.next
    });
  } catch (error: any) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/ingest/edit/:thread_id', async (req, res): Promise<any> => {
  try {
    const thread_id = req.params.thread_id;
    const { markdown } = req.body;
    
    if (!markdown) {
      return res.status(400).json({ error: 'Markdown content is required' });
    }

    const config = { configurable: { thread_id } };
    // Update the state with the edited markdown
    await ingestionGraph.updateState(config, { extractedMarkdown: markdown });

    res.json({ message: 'Markdown updated successfully' });
  } catch (error: any) {
    console.error('Error editing markdown:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/ingest/approve/:thread_id', async (req, res): Promise<any> => {
  try {
    const thread_id = req.params.thread_id;
    const config = { configurable: { thread_id } };
    
    // Update the state to approved
    await ingestionGraph.updateState(config, { reviewStatus: 'approved' }, 'humanReviewNode');
    
    // Resume the graph
    await ingestionGraph.invoke(null, config);

    res.json({ message: 'Document approved and processed' });
  } catch (error: any) {
    console.error('Error approving document:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
// ----------------------------------------

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
