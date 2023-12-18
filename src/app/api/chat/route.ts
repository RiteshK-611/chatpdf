// #region Route
// import { Configuration, OpenAIApi } from "openai-edge";
// import { Message, OpenAIStream, CohereStream, StreamingTextResponse } from "ai";
// import { getContext } from "@/lib/context";
// import { db } from "@/lib/db";
// import { eq } from "drizzle-orm";
// import { chats, messages as _messages } from "@/lib/db/schema";
// import { NextResponse } from "next/server";

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(configuration);

// // IMPORTANT! Set the runtime to edge
// export const runtime = "edge";

// export const POST = async (req: Request) => {
//   try {
//     // Extract the `messages` from the body of the request
//     const { messages, chatId } = await req.json();
//     const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
//     if (_chats.length != 1) {
//       return NextResponse.json({ error: "chat not found" }, { status: 404 });
//     }

//     const fileKey = _chats[0].fileKey;
//     const lastMessage = messages[messages.length - 1];
//     const context = await getContext(lastMessage.content, fileKey);

//     const prompt = {
//       role: "system",
//       content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
//         The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
//         AI is a well-behaved and well-mannered individual.
//         AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
//         AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
//         AI assistant is a big fan of Pinecone and Vercel.
//         START CONTEXT BLOCK
//         ${context}
//         END OF CONTEXT BLOCK
//         AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
//         If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
//         AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
//         AI assistant will not invent anything that is not drawn directly from the context.
//         `,
//     };

//     // Ask OpenAI for a streaming chat completion given the prompt
//     const response = await openai.createChatCompletion({
//       model: "gpt-3.5-turbo",
//       stream: true,
//       messages: [
//         prompt,
//         ...messages.filter((message: Message) => message.role === "user"),
//       ],
//     });
//     // Convert the response into a friendly text-stream
//     const stream = OpenAIStream(response, {
//       onStart: async () => {
//         // save user messages into db
//         await db.insert(_messages).values({
//           chatId,
//           content: lastMessage.content,
//           role: "user",
//         });
//       },
//       onCompletion: async (completion) => {
//         // save ai messages into db
//         await db.insert(_messages).values({
//           chatId,
//           content: completion,
//           role: "system",
//         });
//       },
//     });
//     // Respond with the stream
//     return new StreamingTextResponse(stream);
//   } catch (error) {}
// };
//#endregion

import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream, StreamingTextResponse } from 'ai';
import { experimental_buildOpenAssistantPrompt } from 'ai/prompts';
 
// Create a new HuggingFace Inference instance
const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
 
// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';
 
export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();
 
  const response = Hf.textGenerationStream({
    model: 'OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5',
    inputs: experimental_buildOpenAssistantPrompt(messages),
    parameters: {
      max_new_tokens: 200,
      // @ts-ignore (this is a valid parameter specifically in OpenAssistant models)
      typical_p: 0.2,
      repetition_penalty: 1,
      truncate: 1000,
      return_full_text: false,
    },
  });
 
  // Convert the response into a friendly text-stream
  const stream = HuggingFaceStream(response);
 
  // Respond with the stream
  return new StreamingTextResponse(stream);
}