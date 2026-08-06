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

    // Run the LangGraph agent
    console.log(`Starting LangGraph for question: "${question}"`);
    const initialState = { question, documents: [], answer: '' };
    
    const finalState = await appGraph.invoke(initialState);
    
    res.json({
      answer: finalState.answer,
      usedDocuments: finalState.documents?.map((d: any) => d.metadata),
    });
  } catch (error: any) {
    console.error('Error during chat:', error);
    res.status(500).json({ error: error.message || 'Internal server error during chat' });
  }
});

app.listen(port, () => {
  console.log(`RAG MVP server running on port ${port}`);
});
