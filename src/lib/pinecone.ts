import { Pinecone } from "@pinecone-database/pinecone";

// const pinecone = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY!,
//   environment: process.env.PINECONE_ENVIRONMENT!,
// })
// const index = pinecone.index("pinecone-index")

let pinecone: Pinecone | null = null;

export const getPinecone = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
    });
    return pinecone;
  }
};
