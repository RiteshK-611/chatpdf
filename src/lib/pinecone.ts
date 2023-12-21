import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embedding";
import md5 from "md5";
import { convertToAscii } from "./utils";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!,
});

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

  // 2. split and segment the pages
  // const documents = await Promise.all(pages.map(page => prepareDocuments(page)));
  const documents = await Promise.all(pages.map(prepareDocuments));

  console.log("Documents: " + documents);

  // 3. vectorize and embed individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument));

  console.log("Vectors: " + vectors);

  // 4. upload to pinecone
  const pineconeIndex = pinecone.index("chatpdf");
  // const namespace = pineconeIndex.namespace(convertToAscii(file_key));

  // await PineconeStore.fromDocuments(documents)

  console.log("inserting vectors into pinecone");
  await pineconeIndex.upsert(vectors);
  // await namespace.upsert(vectors);

  return documents[0];
};

const embedDocument = async (doc: Document) => {
  try {
    const embedding = await getEmbeddings([doc.pageContent]);
    const hash = md5(embedding[0]);

    return {
      id: hash,
      values: embedding[0],
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.error("error embedding document", error);
    throw error;
  }
};

const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

const prepareDocuments = async (page: PDFPage) => {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace("/\n/g", "");
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
