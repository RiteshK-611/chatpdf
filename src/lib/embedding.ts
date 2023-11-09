import { Configuration, OpenAIApi } from "openai-edge";
import { CohereClient } from "cohere-ai";

export const getEmbeddings = async (texts: string[]) => {
  try {
    console.log("Init Cohere");
    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY!,
    });

    console.log("Creating Embeddings");
    const vectors = await cohere.embed({
      texts,
      model: "embed-multilingual-v2.0",
    });

    return vectors.embeddings;
  } catch (error) {
    console.log("error calling cohere embedding api", error);
    throw error;
  }
};

// OpenAI
// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(configuration);

// export const getEmbeddings = async (text: string) => {
//   try {
//     console.log("\nOPENAI: ", process.env.OPENAI_API_KEY);
//     const response = await openai.createEmbedding({
//       model: "text-embedding-ada-002",
//       input: text.replace(/\n/g, " "),
//     });
//     const result = await response.json();
//     console.log("\nResult: ", result);
//     return result.data[0].embedding as number[];
//   } catch (error) {
//     console.log("error calling openai embedding api", error);
//     throw error;
//   }
// };
