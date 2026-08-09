import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncWrapper } from '../../../libraries/error-handling/asyncWrapper.js';
import { chatRequestSchema } from '../domain/chatSchema.js';
import { getAppGraph } from '../domain/chatGraph.js';

import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post(
  '/chat',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedBody = chatRequestSchema.parse(req.body);
    const { question, thread_id: providedThreadId } = validatedBody;
    const thread_id = providedThreadId || uuidv4();

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Flush the headers immediately
    res.flushHeaders();

    // Immediately send the thread_id so the client knows it
    res.write(`event: thread\ndata: ${JSON.stringify({ thread_id })}\n\n`);

    console.log(`Starting LangGraph for question: "${question}" in thread: ${thread_id}`);
    const initialState = { question, documents: [], answer: '', rewriteCount: 0 };
    let tokensStreamed = false;
    
    try {
      // Initialize graph with memory
      const appGraph = await getAppGraph();

      // Stream events, passing the thread_id to the checkpointer
      const stream = await appGraph.streamEvents(initialState, { 
        version: 'v2',
        configurable: { thread_id }
      });
      
      for await (const event of stream) {
        if (event.event === 'on_chain_start') {
          // Filter for specific node starts
          if (['retrieve', 'rerankDocuments', 'generate', 'rewrite'].includes(event.name)) {
            res.write(`event: progress\ndata: ${JSON.stringify({ step: event.name })}\n\n`);
          }
        } else if (event.event === 'on_chat_model_stream') {
          const chunk = event.data?.chunk;
          if (chunk && chunk.content) {
            tokensStreamed = true;
            res.write(`event: token\ndata: ${JSON.stringify({ token: chunk.content })}\n\n`);
          }
        } else if (event.event === 'on_chain_end') {
          if (event.name === 'generate') {
            const output = event.data?.output;
            if (output && output.answer && !tokensStreamed) {
              // Send the fallback answer as a token since the LLM was skipped
              res.write(`event: token\ndata: ${JSON.stringify({ token: output.answer })}\n\n`);
            }
          } else if (event.name === 'LangGraph') {
            // Send metadata at the end of the entire graph
            const finalState = event.data?.output;
            if (finalState && finalState.documents) {
              const usedDocuments = finalState.documents.map((d: any) => d.metadata);
              res.write(`event: metadata\ndata: ${JSON.stringify({ usedDocuments })}\n\n`);
            }
          }
        }
      }
      
      res.write(`event: end\ndata: {}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('[ChatSSEError] Error during streaming events:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message || 'Internal streaming error' })}\n\n`);
      res.end();
    }
  })
);

export { router as chatRoutes };
