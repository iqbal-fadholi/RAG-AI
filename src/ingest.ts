import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getVectorStore } from './db/pgvector.js';

export async function processFile(fileBuffer: Buffer, mimetype: string, originalName: string) {
  let docs: any[] = [];
  
  if (mimetype === 'application/pdf') {
    // PDFLoader usually expects a Blob or path. We can wrap buffer in a Blob.
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimetype });
    const loader = new PDFLoader(blob, { splitPages: false });
    docs = await loader.load();
  } else if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
    // Simple text loader
    const text = fileBuffer.toString('utf-8');
    docs = [{ pageContent: text, metadata: { source: originalName } }];
  } else {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }

  // Split documents
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splits = await textSplitter.splitDocuments(docs);

  // Store in pgvector
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(splits);
  
  return splits.length;
}
