import { Configuration, OpenAIApi } from "openai-edge";
import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";

// HuggingFace
const model = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

export const getEmbeddings = async (text: string) => {
  try {
    console.log("HuggingFaceTransformersEmbeddings");
    const response = await model.embedQuery(text.replace(/\n/g, " "));
    
    return response;
  } catch (error) {
    console.log("error calling hugginface embedding api", error);
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
