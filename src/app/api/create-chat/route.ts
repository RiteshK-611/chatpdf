// /api/create-chat

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadPDFIntoPinecone } from "@/lib/pinecone";
import { getDocsFromPDF } from "@/lib/pinecone-new";
import { getStorjUrl } from "@/lib/storj";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export const POST = async (req: Request, res: Response) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { file_key, file_name } = body;
    // await loadPDFIntoPinecone(file_key);
    await getDocsFromPDF(file_key)
    const chat_id = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getStorjUrl(file_key),
        userId,
      })
      .returning({
        insertedId: chats.id,
      });

    return NextResponse.json(
      {
        chat_id: chat_id[0].insertedId,
      },
      { status: 200 }
    );
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
