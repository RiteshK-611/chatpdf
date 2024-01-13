import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embedding";
import md5 from "md5";

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export const loadPDFIntoPinecone = async (file_key: string) => {
  // 1. obtain the pdf -> download and read from pdf
  console.log("downloading pdf into file system...");
  const file_name = await downloadFromS3(file_key);

  if (!file_name) {
    throw new Error("could not download pdf");
  }
  console.log("File Name: ", file_name);
  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  // 2. split and segment the pdf
  const documents = await Promise.all(pages.map(prepareDocument));

  // 3. vectorise and embed individual documents
  const vectors = await Promise.all(
    documents.flat().map((doc) => embedDocument(doc, file_key))
  );

  // 4. upload to pinecone
  await uploadVec(vectors);
};

async function embedDocument(doc: Document, file_key: string) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    console.log(embeddings.length, "Embeddings created");
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pdfKey: file_key,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

const prepareDocument = async (page: PDFPage) => {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, " ");
  // split the docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
};

const uploadVec = async (vectors: PineconeRecord[]) => {
  try {
    console.log("Init Pinecone");
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
    });
    const index = pinecone.Index("chatpdf-google");

    console.log("Upserting into Pinecone");
    await index?.upsert(vectors);
    console.log("Done Upserting!!");
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};
