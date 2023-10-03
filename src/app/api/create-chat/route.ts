// /api/create-chat

import { loadPDFIntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";

export const POST = async (req: Request, res: Response) => {
  try {
    const body = await req.json();
    const { file_key, file_name } = body;
    console.log("hghhjasd: ", file_key, file_name);
    const pages = await loadPDFIntoPinecone(file_key);
    console.log(pages);
    return NextResponse.json({ pages });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: "internal server error",
      },
      {
        status: 500,
      }
    );
  }
};
