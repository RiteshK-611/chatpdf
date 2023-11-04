import { Configuration, OpenAIApi } from "openai-edge";
import { CohereEmbeddings } from "langchain/embeddings/cohere";
import { CohereClient } from "cohere-ai";

const cohere = new CohereEmbeddings({
  apiKey: "BJ100bNW6QTZ8XSSVQTajZY36jng5HjbZ1eJu2Yc",
  modelName: "embed-english-light-v2.0",
});

const coheres = new CohereClient({
  token: "BJ100bNW6QTZ8XSSVQTajZY36jng5HjbZ1eJu2Yc",
});

export const getEmbeddings = async (text: string) => {
  try {
    console.log("\nCohere: ", process.env.COHERE_API_KEY);
    const response = await cohere.embedQuery("Hello world");
    console.log("got the response");
    return response;
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
