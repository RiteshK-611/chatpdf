import { Pinecone } from "@pinecone-database/pinecone";
import { downlondFromStorj } from "./storj-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

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

export const loadPDFIntoPinecone = async (file_key: string) => {
  // 1. obtain the pdf -> download and read from pdf
  console.log("downloading pdf into file system...");
  const file_name = await downlondFromStorj(file_key);

  if (!file_name) {
    throw new Error("could not download pdf");
  }
  console.log("File Name: ", file_name);
  const loader = new PDFLoader(file_name);
  const pages = await loader.load();
  return pages;
};
