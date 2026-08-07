import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { Document } from '@langchain/core/documents';
import { getVectorStore } from '../db/pgvector.js';
import { config } from '../config.js';

// 1. Define the State
export const GraphState = Annotation.Root({
  question: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  documents: Annotation<Document[]>({
    reducer: (x, y) => y ?? x,
  }),
  answer: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
});

const llm = new ChatGoogleGenerativeAI({
  apiKey: config.googleApiKey,
  model: 'gemini-3.5-flash',
  temperature: 0,
});

// A dedicated non-streaming LLM for grading to avoid consuming
// the streaming quota (streamGenerateContent) on relevance checks.
const gradingLlmBase = new ChatGoogleGenerativeAI({
  apiKey: config.googleApiKey,
  model: 'gemini-3.5-flash',
  temperature: 0,
  streaming: false,
});

// 2. Nodes

async function retrieve(state: typeof GraphState.State) {
  console.log('---RETRIEVE---');
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever({ k: 4 });
  const docs = await retriever.invoke(state.question);
  return { documents: docs };
}

async function gradeDocuments(state: typeof GraphState.State) {
  console.log('---GRADE DOCUMENTS---');
  const { question, documents } = state;
  
  // Use the dedicated non-streaming LLM for grading to avoid wasting
  // streaming quota on relevance checks.
  const gradingLlm = gradingLlmBase.withStructuredOutput(
    z.object({
      binary_score: z.enum(['yes', 'no']).describe("Relevance score 'yes' or 'no'"),
    }),
    { name: 'grade_relevance' }
  );

  const prompt = PromptTemplate.fromTemplate(`
    You are a grader assessing relevance of a retrieved document to a user question.
    Here is the retrieved document: \n\n {document} \n\n
    Here is the user question: {question}
    If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant.
    Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question.
  `);

  const chain = prompt.pipe(gradingLlm);

  const filteredDocs: Document[] = [];
  for (const doc of documents) {
    const res = await chain.invoke({
      document: doc.pageContent,
      question: question,
    });
    if (res.binary_score === 'yes') {
      filteredDocs.push(doc);
    }
  }

  return { documents: filteredDocs };
}

async function generate(state: typeof GraphState.State) {
  console.log('---GENERATE---');
  const { question, documents } = state;
  
  const prompt = PromptTemplate.fromTemplate(`
    You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. 
    If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
    Question: {question} 
    Context: {context} 
    Answer:
  `);

  const docsContent = documents.map((doc) => doc.pageContent).join('\n\n');
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  const answer = await chain.invoke({
    question: question,
    context: docsContent,
  });

  return { answer };
}

async function rewrite(state: typeof GraphState.State) {
  console.log('---REWRITE QUESTION---');
  const { question } = state;
  
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
  return { question: betterQuestion };
}

// 3. Edges

function decideToGenerate(state: typeof GraphState.State) {
  console.log('---DECIDE TO GENERATE---');
  const { documents } = state;
  
  if (!documents || documents.length === 0) {
    console.log('---DECISION: ALL DOCUMENTS ARE NOT RELEVANT, REWRITE---');
    return 'rewrite';
  }
  
  console.log('---DECISION: GENERATE---');
  return 'generate';
}

// 4. Build Graph
const workflow = new StateGraph(GraphState)
  .addNode('retrieve', retrieve)
  .addNode('gradeDocuments', gradeDocuments)
  .addNode('generate', generate)
  .addNode('rewrite', rewrite)
  
  .addEdge(START, 'retrieve')
  .addEdge('retrieve', 'gradeDocuments')
  .addConditionalEdges('gradeDocuments', decideToGenerate, {
    rewrite: 'rewrite',
    generate: 'generate',
  })
  .addEdge('rewrite', 'retrieve')
  .addEdge('generate', END);

export const appGraph = workflow.compile();
