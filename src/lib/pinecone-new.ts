import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { downlondFromStorj } from "./storj-server";
import * as dotnev from "dotenv";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { CohereEmbeddings } from "langchain/embeddings/cohere";
import { Cohere, CohereClient } from "cohere-ai";
import md5 from "md5";

dotnev.config();

export const getDocsFromPDF = async (file_key: string) => {
  // 1. obtain the pdf -> download and read from pdf
  console.log("downloading pdf into file system...");
  const file_name = await downlondFromStorj(file_key);

  if (!file_name) {
    throw new Error("could not download pdf");
  }
  console.log("File Name: ", file_name);
  const loader = new PDFLoader(file_name);

  const docs = await loader.load();

  console.log("Splitteing docs.................");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splittedDocs = await splitter.splitDocuments(docs);

  const pageContents = splittedDocs.map((doc) => doc.pageContent);
  console.log(pageContents[0]);

  console.log("Calling Embedding documents----------");
  embedAndStoreDocs(pageContents, file_name);
};

// @ts-ignore docs type error
const embedAndStoreDocs = async (docs: string[], file_name: string) => {
  try {
    console.log("Init Cohere");
    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY!,
    });

    console.log("Embedding docs-----");
    const vectors = await cohere.embed({
      texts: docs,
      model: "embed-multilingual-v2.0",
    });

    console.log("Creating DocsVec.........");
    const docsVec = vectors.embeddings.map((embedding, index) => {
      const hash = md5(embedding);
      return {
        id: hash,
        values: embedding,
        metadata: {
          text: docs[index],
          pdfName: file_name,
        },
      } as PineconeRecord;
    });
    console.log(docsVec[0]);

    console.log("Init Pinecone");
    const pinecone = new Pinecone();
    const index = pinecone.Index("chatpdf-cohere");
    console.log("Calling PineconeStore-----------");
    await index.upsert(docsVec);
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};
