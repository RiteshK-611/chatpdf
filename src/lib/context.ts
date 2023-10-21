import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embedding";

export const getMatchesFromEmbeddings = async (
  embeddings: number[],
  fileKey: string
) => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });

  const index = await pinecone.Index("chatpdf");

  try {
    const namespace = convertToAscii(fileKey);
    const queryResponse = await index.namespace(namespace).query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
    });

    return queryResponse.matches || [];
  } catch (error) {
    console.log("error querying embeddings", error);
    throw error;
  }
};

export const getContext = async (query: string, fileKey: string) => {
  const queryEmbeddings = await getEmbeddings(fileKey);
  const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

  const qualifyingDocs = matches.filter(
    (match) => match.score && match.score > 0.7
  );

  type Metadata = {
    text: string,
    pageNumber: number
  }

  let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text)

  return docs.join("\n").substring(0, 3000)
};
