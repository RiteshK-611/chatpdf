import S3 from "aws-sdk/clients/s3";
import fs from "fs";

export const downlondFromStorj = async (file_key: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const s3 = new S3({
        accessKeyId: process.env.NEXT_PUBLIC_STORJ_ACCESS_KEY2,
        secretAccessKey: process.env.NEXT_PUBLIC_STROJ_SECRET_ACCESS_KEY2,
        endpoint: process.env.NEXT_PUBLIC_STORJ_ENDPOINT,
      });

      const params = {
        Bucket: process.env.NEXT_PUBLIC_STORJ_BUCKET_NAME!,
        Key: file_key,
      };

      console.log("\nBucket: ", process.env.NEXT_PUBLIC_STORJ_BUCKET_NAME);
      console.log("File Key: ", file_key);

      const obj = await s3.getObject(params).promise();
      const file_name = `./tmp/pdf-${Date.now()}.pdf`;

      if (obj.Body instanceof require("stream").Readable) {
        console.log("----------Readable----------");
        const file = fs.createWriteStream(file_name);
        file.on("open", function (fd) {
          // @ts-ignore
          obj.Body?.pipe(file).on("finish", () => {
            return resolve(file_name);
          });
        });
        // obj.Body?.pipe(fs.createWriteStream(file_name));
      } else {
        console.log("----------Buffer----------");
        fs.writeFileSync(file_name, obj.Body as Buffer);
        console.log("\nFileNamw: " + file_name);
        console.log("\nBuffer: " + obj.Body);
        return resolve(file_name);
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  });
};
