import { getVectorStore } from './db/pgvector.js';
import { Document } from '@langchain/core/documents';

async function ingestDummyData() {
  console.log('Connecting to Vector Store...');
  const vectorStore = await getVectorStore();

  const dummyDocuments = [
    new Document({
      pageContent: "The majestic blue whale is the largest animal known to have ever lived on Earth.",
      metadata: { source: "dummy_data", topic: "animals" }
    }),
    new Document({
      pageContent: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.",
      metadata: { source: "dummy_data", topic: "science" }
    }),
    new Document({
      pageContent: "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel.",
      metadata: { source: "dummy_data", topic: "landmarks" }
    }),
    new Document({
      pageContent: "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
      metadata: { source: "dummy_data", topic: "programming" }
    }),
    new Document({
      pageContent: "General relativity, also known as the general theory of relativity and Einstein's theory of gravity, is the geometric theory of gravitation published by Albert Einstein in 1915.",
      metadata: { source: "dummy_data", topic: "physics" }
    })
  ];

  console.log('Ingesting dummy documents...');
  await vectorStore.addDocuments(dummyDocuments);
  
  console.log(`Successfully ingested ${dummyDocuments.length} dummy documents!`);
  process.exit(0);
}

ingestDummyData().catch(error => {
  console.error('Error ingesting dummy data:', error);
  process.exit(1);
});
