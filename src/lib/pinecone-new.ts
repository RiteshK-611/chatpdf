import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { downlondFromStorj } from "./storj-server";
import * as dotnev from "dotenv";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { CohereClient } from "cohere-ai";
import md5 from "md5";

dotnev.config();

export const embedAndStorePDF = async (file_key: string) => {
  // 1. obtain the pdf -> download and read from pdf
  console.log("downloading pdf into file system...");
  const file_name = await downlondFromStorj(file_key);

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

  const vectors = await embedPDF(pageContents, file_name);

  storePDF(vectors);
};

export const embedPDF = async (texts: string[], file_name: string) => {
  try {
    console.log("Init Cohere");
    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY!,
    });

    console.log("Embedding PDF");
    const vectors = await cohere.embed({
      texts,
      model: "embed-multilingual-v2.0",
    });

    console.log("Creating PDF Docs Vectors");
    const docsVec = vectors.embeddings.map((embedding, index) => {
      const hash = md5(embedding);
      return {
        id: hash,
        values: embedding,
        metadata: {
          text: texts[index],
          pdfName: file_name,
        },
      } as PineconeRecord;
    });

    return docsVec;
  } catch (error) {
    console.log("Error Embedding text with Cohere");
    throw error;
  }
};

const storePDF = async (vectors: PineconeRecord[]) => {
  try {
    console.log("Init Pinecone");
    const pinecone = new Pinecone();
    const index = pinecone.Index("chatpdf-cohere");
    console.log("Upserting into Pinecone");
    await index?.upsert(vectors);
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};
