import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbeddings } from "./embedding";

export const getMatchesFromEmbeddings = async (
  embeddings: number[],
  fileKey: string
) => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const index = pinecone.Index("chatpdf-cohere");

  try {
    const queryResponse = await index.query({
      topK: 5,
      vector: embeddings,
      filter: { pdfName: { $eq: fileKey } },
      includeMetadata: true,
    });

    return queryResponse.matches || [];
  } catch (error) {
    console.log("error querying embeddings", error);
    throw error;
  }
};

export const getContext = async (query: string, fileKey: string) => {
  const queryEmbeddings = await getEmbeddings([query]);
  console.log("Query Embeddings:", queryEmbeddings);
  const matches = await getMatchesFromEmbeddings(queryEmbeddings[0], fileKey);

  const qualifyingDocs = matches.filter(
    (match) => match.score && match.score > 0.7
  );

  type Metadata = {
    text: string;
    pdfKey: string;
  };

  let docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);

  return docs.join("\n").substring(0, 3000);
};
