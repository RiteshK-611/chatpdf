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

// #region Route1
// import { NextRequest, NextResponse } from "next/server";
// import {
//   Message as VercelChatMessage,
//   StreamingTextResponse,
//   LangChainStream,
// } from "ai";
// import { ChatGooglePaLM } from "langchain/chat_models/googlepalm";
// import { BytesOutputParser } from "langchain/schema/output_parser";
// import { PromptTemplate } from "langchain/prompts";
// import { chats, messages as _messages } from "@/lib/db/schema";
// import { db } from "@/lib/db";

// export const runtime = "edge";

// /**
//  * Basic memory formatter that stringifies and passes
//  * message history directly into the model.
//  */
// const formatMessage = (message: VercelChatMessage) => {
//   return `${message.role}: ${message.content}`;
// };

// const TEMPLATE = `You are a pirate named Patchy. All responses must be extremely verbose and in pirate dialect.
 
// Current conversation:
// {chat_history}
 
// User: {input}
// AI:`;

// /*
//  * This handler initializes and calls a simple chain with a prompt,
//  * chat model, and output parser. See the docs for more information:
//  *
//  * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
//  */
// export async function POST(req: NextRequest) {
//   try {
//     // Extract the `messages` from the body of the request
//     const { messages, chatId } = await req.json();
//     const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
//     const currentMessageContent = messages[messages.length - 1].content;

//     const prompt = PromptTemplate.fromTemplate(TEMPLATE);
//     /**
//      * See a full list of supported models at:
//      * https://js.langchain.com/docs/modules/model_io/models/
//      */
//     //   const model = new ChatOpenAI({
//     //     temperature: 0.8,
//     //   });
//     const model = new ChatGooglePaLM({
//       apiKey: process.env.GOOGLE_PALM_API_KEY,
//       temperature: 0.3,
//     });

//     /**
//      * Chat models stream message chunks rather than bytes, so this
//      * output parser handles serialization and encoding.
//      */
//     const outputParser = new BytesOutputParser();

//     /*
//      * Can also initialize as:
//      *
//      * import { RunnableSequence } from "langchain/schema/runnable";
//      * const chain = RunnableSequence.from([prompt, model, outputParser]);
//      */
//     const chain = prompt.pipe(model).pipe(outputParser);

//     const stream = await chain.stream({
//       chat_history: formattedPreviousMessages.join("\n"),
//       input: currentMessageContent,
//     });

//     LangChainStream({
//       onStart: async () => {
//         // save user messages into db
//         await db.insert(_messages).values({
//           chatId,
//           content: currentMessageContent,
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

//     return new StreamingTextResponse(stream);
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message }, { status: 500 });
//   }
// }
// #endregion

// #region Route2
import { LangChainStream, StreamingTextResponse } from "ai";
import { ChatGooglePaLM } from "langchain/chat_models/googlepalm";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { NextResponse } from "next/server";
import { chats, messages as _messages } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getContext } from "@/lib/context";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }

    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);

    const { stream, handlers, writer } = LangChainStream({
      onStart: async () => {
        // save user messages into db
        console.log("Inside OnStart Function");
        await db.insert(_messages).values({
          chatId,
          content: lastMessage.content,
          role: "user",
        });
      },
      onCompletion: async (completion) => {
        // save ai messages into db
        console.log("Inside OnCompletion Function");
        await db.insert(_messages).values({
          chatId,
          content: completion,
          role: "system",
        });
      },
    });

    const model = new ChatGooglePaLM({
      apiKey: process.env.GOOGLE_PALM_API_KEY,
      temperature: 0.3,
    });

    // ask questions
    const questions = [
      new SystemMessage(context),
      new HumanMessage(lastMessage.content),
    ];

    await model.call(questions, {}, [handlers]).catch(console.error);

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
// #endregion