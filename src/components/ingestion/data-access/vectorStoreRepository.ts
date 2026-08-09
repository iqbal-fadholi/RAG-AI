import { getVectorStore } from '../../../libraries/db/pgvector.js';
import { Document } from '@langchain/core/documents';

export class VectorStoreRepository {
  async addDocuments(documents: Document[]): Promise<void> {
    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(documents);
  }
}
