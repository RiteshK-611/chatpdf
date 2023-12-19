import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { downlondFromS3 } from "./s3-server";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import md5 from "md5";
import { getEmbeddings } from "./embedding";

export const embedAndStorePDF = async (file_key: string) => {
  // 1. obtain the pdf -> download and read from pdf
  console.log("downloading pdf into file system...");
  const file_name = await downlondFromS3(file_key);

  if (!file_name) {
    throw new Error("could not download pdf");
  }
  console.log("File Name: ", file_name);
  const loader = new PDFLoader(file_name);

  const docs = await loader.load();

  console.log("Splitteing PDF");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splittedDocs = await splitter.splitDocuments(docs);
  const pageContents = splittedDocs.map((doc) => doc.pageContent);

  const vectors = await embedPDF(pageContents, file_key);

  storePDF(vectors);
};

export const embedPDF = async (texts: string[], file_key: string) => {
  try {
    const embeddings = await getEmbeddings(texts);

    console.log("Creating PDF Docs Vectors");
    const docsVec = embeddings.map((embedding, index) => {
      const hash = md5(embedding);
      return {
        id: hash,
        values: embedding,
        metadata: {
          text: texts[index],
          pdfKey: file_key,
        },
      } as PineconeRecord;
    });
    console.log(embeddings.length, "Embeddings created");

    return docsVec;
  } catch (error) {
    console.log("Error Embedding text with Cohere");
    throw error;
  }
};

const storePDF = async (vectors: PineconeRecord[]) => {
  try {
    console.log("Init Pinecone");
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
    });
    const index = pinecone.Index("chatpdf-cohere");

    console.log("Upserting into Pinecone");
    await index?.upsert(vectors);
    console.log("Done!!");
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};
