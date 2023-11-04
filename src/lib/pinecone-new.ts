import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { downlondFromStorj } from "./storj-server";
import * as dotnev from "dotenv";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

dotnev.config();

const getDocsFromPDF = async (file_key: string) => {
  // 1. obtain the pdf -> download and read from pdf
  console.log("downloading pdf into file system...");
  const file_name = await downlondFromStorj(file_key);

  if (!file_name) {
    throw new Error("could not download pdf");
  }
  console.log("File Name: ", file_name);
  const loader = new PDFLoader(file_name);

  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splittedDocs = splitter.splitDocuments(docs);
};

// @ts-ignore docs type error
const embedAndStoreDocs = async (docs: Document<Record<string, any>>[]) => {
  try {
    const embeddings = new OpenAIEmbeddings();
    const pinecone = new PineconeClient();

    const index = pinecone.Index("chatpdf");

    await PineconeStore.fromDocuments(docs, embeddings, { pineconeIndex: index});
  } catch (error) {}
};
