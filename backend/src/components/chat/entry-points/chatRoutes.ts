import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncWrapper } from '../../../libraries/error-handling/asyncWrapper.js';
import { chatRequestSchema } from '../domain/chatSchema.js';
import { getAppGraph } from '../domain/chatGraph.js';
import {
  listUserConversations,
  getConversationDetails,
  ensureConversation,
  saveConversationMessage,
  renameConversation,
  deleteConversation,
} from '../domain/conversationService.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 1. Get all conversations for current user
router.get(
  '/conversations',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const conversations = await listUserConversations(userId);
    res.json(conversations);
  })
);

// 2. Get specific conversation details & messages
router.get(
  '/conversations/:id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({ error: 'Invalid conversation ID' });
      return;
    }
    const result = await getConversationDetails(id, userId);
    if (!result) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json(result);
  })
);

// 3. Rename a conversation
router.patch(
  '/conversations/:id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({ error: 'Invalid conversation ID' });
      return;
    }
    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const updated = await renameConversation(id, userId, title.trim());
    if (!updated) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json(updated);
  })
);

// 4. Delete a conversation
router.delete(
  '/conversations/:id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({ error: 'Invalid conversation ID' });
      return;
    }
    const deleted = await deleteConversation(id, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ success: true });
  })
);

// 5. Send message & stream response
router.post(
  '/chat',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedBody = chatRequestSchema.parse(req.body);
    const { question, thread_id: providedThreadId } = validatedBody;
    const thread_id = providedThreadId || uuidv4();
    const userId = req.user?.userId;

    // Persist conversation and user message if user is authenticated
    if (userId) {
      try {
        await ensureConversation(thread_id, userId, question);
        await saveConversationMessage(thread_id, 'user', question, []);
      } catch (err) {
        console.error('[ConversationSaveError] Error saving initial user message:', err);
      }
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Flush the headers immediately
    res.flushHeaders();

    // Immediately send the thread_id so the client knows it
    res.write(`event: thread\ndata: ${JSON.stringify({ thread_id })}\n\n`);

    console.log(`Starting LangGraph for question: "${question}" in thread: ${thread_id}`);
    // OBAC: pass allowed tag IDs to the graph for retrieval filtering
    // Admin users get ['*'] sentinel = no filter; other users get their actual tags
    const isAdmin = req.user?.pages?.includes('admin');
    const allowedTagIds = isAdmin ? ['*'] : (req.user?.allowedTagIds || []);
    const initialState = { question, documents: [], rawDocuments: [], recommendations: [], answer: '', rewriteCount: 0, allowedTagIds };
    let tokensStreamed = false;
    let accumulatedAnswer = '';
    let finalSources: any[] = [];
    let finalRecommendations: string[] = [];
    
    try {
      // Initialize graph with memory
      const appGraph = await getAppGraph();

      // Stream events, passing the thread_id to the checkpointer
      const stream = await appGraph.streamEvents(initialState, { 
        version: 'v2',
        configurable: { thread_id }
      });
      
      for await (const event of stream) {
        console.log(`[LangGraph Stream] event: ${event.event}, name: ${event.name}`);
        if (event.event === 'on_chain_start') {
          // Filter for specific node starts
          if (['retrieve', 'rerankDocuments', 'generate', 'recommendFollowUps', 'rewrite'].includes(event.name)) {
            res.write(`event: progress\ndata: ${JSON.stringify({ step: event.name })}\n\n`);
          }
        } else if (event.event === 'on_chat_model_stream') {
          // Only stream tokens generated from the final 'generate' node to the client.
          // This prevents internal utility nodes (like generateQueries or rewrite) from sending their internal tokens.
          if (event.metadata?.langgraph_node === 'generate') {
            const chunk = event.data?.chunk;
            if (chunk && chunk.content) {
              tokensStreamed = true;
              accumulatedAnswer += chunk.content;
              res.write(`event: token\ndata: ${JSON.stringify({ token: chunk.content })}\n\n`);
            }
          }
        } else if (event.event === 'on_chain_end') {
          if (event.name === 'generate') {
            const output = event.data?.output;
            if (output && output.answer && !tokensStreamed) {
              accumulatedAnswer = output.answer;
              // Send the fallback answer as a token since the LLM was skipped
              res.write(`event: token\ndata: ${JSON.stringify({ token: output.answer })}\n\n`);
            }
          } else if (event.name === 'recommendFollowUps') {
            const output = event.data?.output;
            if (output?.recommendations && Array.isArray(output.recommendations)) {
              finalRecommendations = output.recommendations;
            }
            if (output?.answer && output.answer.length > accumulatedAnswer.length) {
              const addition = output.answer.slice(accumulatedAnswer.length);
              accumulatedAnswer = output.answer;
              res.write(`event: token\ndata: ${JSON.stringify({ token: addition })}\n\n`);
            }
          } else if (event.name === 'LangGraph') {
            // Send metadata at the end of the entire graph
            const finalState = event.data?.output;
            if (finalState) {
              if (finalState.recommendations && Array.isArray(finalState.recommendations)) {
                finalRecommendations = finalState.recommendations;
              }
              const usedDocuments = (finalState.documents || []).map((d: any) => d.metadata);
              finalSources = (finalState.documents || []).map((d: any, idx: number) => ({
                index: idx + 1,
                fileId: d.metadata?.file_id || d.metadata?.fileId || null,
                filename: d.metadata?.filename || d.metadata?.source || `Document ${idx + 1}`,
                content: d.pageContent,
                metadata: d.metadata || {},
              }));
              res.write(`event: metadata\ndata: ${JSON.stringify({ thread_id, sources: finalSources, usedDocuments, recommendations: finalRecommendations })}\n\n`);
            }
          }
        }
      }
      
      // Save AI message to database
      if (userId && accumulatedAnswer) {
        try {
          await saveConversationMessage(thread_id, 'ai', accumulatedAnswer, finalSources);
        } catch (err) {
          console.error('[ConversationSaveError] Error saving AI response message:', err);
        }
      }

      res.write(`event: end\ndata: {}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('[ChatSSEError] Error during streaming events:', error);
      if (userId && !tokensStreamed) {
        try {
          await saveConversationMessage(
            thread_id,
            'ai',
            'I encountered an error processing your query. Please try again.',
            []
          );
        } catch (_) {}
      }
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message || 'Internal streaming error' })}\n\n`);
      res.end();
    }
  })
);

export { router as chatRoutes };
