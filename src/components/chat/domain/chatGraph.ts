import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { Document } from '@langchain/core/documents';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { getVectorStore } from '../../../libraries/db/pgvector.js';
import { config } from '../../../libraries/config/index.js';
import { getPostgresSaver } from '../../../libraries/db/checkpoint.js';
import { keywordSearch } from '../../../libraries/db/documents.js';

// 1. Define the State
export const GraphState = Annotation.Root({
  question: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  searchQueries: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
  }),
  documents: Annotation<Document[]>({
    reducer: (x, y) => y ?? x,
  }),
  answer: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  rewriteCount: Annotation<number>({
    reducer: (x, y) => y ?? x,
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

const llm = new ChatGoogleGenerativeAI({
  apiKey: config.googleApiKey,
  model: 'gemini-3.5-flash',
  temperature: 0,
});

const gradingLlmBase = new ChatGoogleGenerativeAI({
  apiKey: config.googleApiKey,
  model: 'gemini-3.5-flash',
  temperature: 0,
  streaming: false,
});

// 2. Nodes

async function generateQueries(state: typeof GraphState.State) {
  console.log('---GENERATE MULTI-QUERIES---');
  const { question, messages } = state;
  
  const queryGenLlm = gradingLlmBase.withStructuredOutput(
    z.object({
      queries: z.array(z.string()).min(1).max(3).describe("A list of 3 semantic variations of the search query"),
    }),
    { name: 'generate_queries' }
  );

  let prompt: any;
  let chainOptions: any;

  if (messages.length === 0) {
    prompt = PromptTemplate.fromTemplate(`
      You are an AI assistant tasked with generating search queries to retrieve relevant documents from a vector database.
      Given the following user question, generate 3 distinct semantic variations of the question to maximize recall.
      Focus on different keywords, synonyms, and phrasing.
      
      User Question: {question}
    `);
    chainOptions = { question: question };
  } else {
    prompt = PromptTemplate.fromTemplate(`
      You are an AI assistant tasked with generating search queries to retrieve relevant documents from a vector database.
      Given the following chat history and a follow-up question, first understand the underlying intent, then generate 3 distinct semantic variations of the standalone question to maximize recall.
      
      Chat History:
      {chat_history}
      
      Follow Up Input: {question}
    `);
    const chatHistoryStr = messages.map(m => `${m._getType() === 'human' ? 'User' : 'AI'}: ${m.content}`).join('\n');
    chainOptions = { chat_history: chatHistoryStr, question: question };
  }

  const chain = prompt.pipe(queryGenLlm);
  
  try {
    const res = await chain.invoke(chainOptions);
    console.log(`Generated queries: ${res.queries.join(', ')}`);
    return { searchQueries: res.queries };
  } catch (error) {
    console.error('Failed to generate queries, falling back to original question');
    return { searchQueries: [question] };
  }
}

async function retrieve(state: typeof GraphState.State) {
  console.log('---HYBRID MULTI-QUERY RETRIEVE---');
  
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever({ k: 10 });
  
  // Use generated queries or fallback to original question
  const queries = state.searchQueries && state.searchQueries.length > 0 
    ? state.searchQueries 
    : [state.question];

  // Execute both searches concurrently for ALL queries
  const promises = queries.map(q => Promise.all([
    retriever.invoke(q),
    keywordSearch(q, 10)
  ]));

  const results = await Promise.all(promises);

  // Map to a common format and track rankings for Reciprocal Rank Fusion
  const docMap = new Map<string, { doc: Document, rrfScore: number }>();
  const K = 60; // Standard RRF constant

  const addScore = (docOrKDoc: any, rank: number, isKeyword: boolean) => {
    const key = isKeyword ? docOrKDoc.page_content : docOrKDoc.pageContent;
    const current = docMap.get(key) || { 
      doc: isKeyword ? new Document({ pageContent: key, metadata: docOrKDoc.metadata }) : docOrKDoc, 
      rrfScore: 0 
    };
    current.rrfScore += 1 / (K + rank);
    docMap.set(key, current);
  };
  
  results.forEach(([semanticDocs, keywordDocs]) => {
    semanticDocs.forEach((doc, index) => addScore(doc, index + 1, false));
    keywordDocs.forEach((kDoc, index) => addScore(kDoc, index + 1, true));
  });

  // Sort by RRF score descending and keep top 10 overall
  const finalDocs = Array.from(docMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, 10)
    .map(item => item.doc);

  console.log(`Fused ${docMap.size} unique docs down to top ${finalDocs.length} using RRF.`);
  return { documents: finalDocs };
}

async function rerankDocuments(state: typeof GraphState.State) {
  console.log('---RERANK DOCUMENTS---');
  const { question, documents } = state;
  
  const rerankingLlm = gradingLlmBase.withStructuredOutput(
    z.object({
      score: z.number().int().min(1).max(10).describe("Relevance score from 1 to 10"),
    }),
    { name: 'score_relevance' }
  );

  const prompt = PromptTemplate.fromTemplate(`
    You are an expert evaluator assessing the relevance of a retrieved document to a user question.
    Here is the retrieved document: \n\n {document} \n\n
    Here is the user question: {question}
    Assign a relevance score from 1 to 10. 
    1 means completely irrelevant, 10 means highly relevant and directly answers the question.
  `);

  const chain = prompt.pipe(rerankingLlm);

  // Run the LLM on all 10 documents concurrently
  const scoredDocs = await Promise.all(
    documents.map(async (doc) => {
      try {
        const res = await chain.invoke({
          document: doc.pageContent,
          question: question,
        });
        return { doc, score: res.score };
      } catch (error) {
        // Fallback score if LLM fails
        return { doc, score: 1 };
      }
    })
  );

  // Sort descending and keep the top 4 documents that have a score >= 4
  const topDocs = scoredDocs
    .filter(item => item.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.doc);

  return { documents: topDocs };
}

async function generate(state: typeof GraphState.State) {
  console.log('---GENERATE---');
  const { question, documents, messages } = state;
  
  if (!documents || documents.length === 0) {
    const emptyAnswer = 'I could not find relevant information in the uploaded documents to answer your question.';
    return { 
      answer: emptyAnswer,
      messages: [new HumanMessage(question), new AIMessage(emptyAnswer)]
    };
  }
  
  const prompt = PromptTemplate.fromTemplate(`
    You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. 
    If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
    
    CRITICAL INSTRUCTION FOR CITATIONS:
    You MUST explicitly cite your sources in your answer. Each piece of retrieved context below is preceded by a header like "--- Document [1] (Source: filename) ---".
    Whenever you use information from a document, you MUST append a citation like [1] or [2] directly after the sentence.

    Chat History:
    {chat_history}

    Question: {question} 
    Context: 
    {context} 
    
    Answer:
  `);

  const chatHistoryStr = messages.map(m => `${m._getType() === 'human' ? 'User' : 'AI'}: ${m.content}`).join('\n');
  
  // Format context with explicit Document IDs and Sources
  const docsContent = documents.map((doc, index) => {
    const sourceName = doc.metadata?.source || 'Unknown Source';
    return `--- Document [${index + 1}] (Source: ${sourceName}) ---\n${doc.pageContent}`;
  }).join('\n\n');
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  const stream = await chain.stream({
    chat_history: chatHistoryStr,
    question: question,
    context: docsContent,
  });

  let answer = '';
  for await (const chunk of stream) {
    answer += chunk;
  }

  // Append new messages to history
  return { 
    answer,
    messages: [new HumanMessage(question), new AIMessage(answer)]
  };
}

async function rewrite(state: typeof GraphState.State) {
  console.log('---REWRITE QUESTION---');
  const { question, rewriteCount } = state;
  const currentCount = rewriteCount ?? 0;
  
  const prompt = PromptTemplate.fromTemplate(`
    You are a question re-writer that converts an input question to a better version that is optimized 
    for vectorstore retrieval. Look at the input and try to reason about the underlying semantic intent / meaning.
    Here is the initial question:
    \n ------- \n
    {question} 
    \n ------- \n
    Formulate an improved question.
  `);

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  const betterQuestion = await chain.invoke({ question });
  return { question: betterQuestion, rewriteCount: currentCount + 1 };
}

async function summarizeHistory(state: typeof GraphState.State) {
  console.log('---SUMMARIZE HISTORY---');
  const { messages } = state;
  
  // Summarize everything except the most recent pair
  const messagesToSummarize = messages.slice(0, -2);
  const recentMessages = messages.slice(-2);
  
  const prompt = PromptTemplate.fromTemplate(`
    Summarize the following conversation concisely to serve as context for future turns:
    {chat_history}
  `);

  const chatHistoryStr = messagesToSummarize.map(m => `${m._getType() === 'human' ? 'User' : 'AI'}: ${m.content}`).join('\n');
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  const summary = await chain.invoke({ chat_history: chatHistoryStr });
  
  // Return the new messages list replacing old messages with the summary
  // We use a custom object because we want to REPLACE the state, not append to it. 
  // Wait, our reducer is x.concat(y), which means returning an array appends it.
  // To replace it, we need to clear it. In LangGraph JS, to overwrite an array with a concat reducer, 
  // we would need a custom reducer. For now, since this MVP is simple, let's skip the summarization
  // OR we can change the reducer to handle overwrites if a special flag is passed.
  // Given we are doing a quick MVP, let's keep it simple: we won't rewrite the array, 
  // we'll just let the state grow. We will comment this out for now to avoid complexity in the reducer.
  console.log('Skipping summary for now due to reducer complexity in MVP.');
  return {}; 
}

// 3. Edges

function decideToGenerate(state: typeof GraphState.State) {
  console.log('---DECIDE TO GENERATE---');
  const { documents, rewriteCount } = state;
  const count = rewriteCount ?? 0;
  
  if (!documents || documents.length === 0) {
    if (count >= 3) {
      console.log('---DECISION: ALL DOCUMENTS ARE NOT RELEVANT, MAX REWRITES REACHED. GENERATE---');
      return 'generate';
    }
    console.log(`---DECISION: ALL DOCUMENTS ARE NOT RELEVANT, REWRITE (attempt ${count + 1}/3)---`);
    return 'rewrite';
  }
  
  console.log('---DECISION: GENERATE---');
  return 'generate';
}

function decideToSummarize(state: typeof GraphState.State) {
  console.log('---DECIDE TO SUMMARIZE---');
  const { messages } = state;
  
  if (messages.length > 6) {
    return 'summarizeHistory';
  }
  
  return END;
}

// 4. Build Graph
export const getAppGraph = async () => {
  const checkpointer = await getPostgresSaver();

  const workflow = new StateGraph(GraphState)
    .addNode('generateQueries', generateQueries)
    .addNode('retrieve', retrieve)
    .addNode('rerankDocuments', rerankDocuments)
    .addNode('generate', generate)
    .addNode('rewrite', rewrite)
    .addNode('summarizeHistory', summarizeHistory)
    
    .addEdge(START, 'generateQueries')
    .addEdge('generateQueries', 'retrieve')
    .addEdge('retrieve', 'rerankDocuments')
    .addConditionalEdges('rerankDocuments', decideToGenerate, {
      rewrite: 'rewrite',
      generate: 'generate',
    })
    .addEdge('rewrite', 'retrieve')
    .addConditionalEdges('generate', decideToSummarize, {
      summarizeHistory: 'summarizeHistory',
      [END]: END,
    })
    .addEdge('summarizeHistory', END);

  return workflow.compile({ checkpointer });
};
