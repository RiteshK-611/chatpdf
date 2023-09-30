import S3 from "aws-sdk/clients/s3";

export const uploadToStorj = async (file: File) => {
  try {
    const s3 = new S3({
      accessKeyId: process.env.NEXT_PUBLIC_STORJ_ACCESS_KEY,
      secretAccessKey: process.env.NEXT_PUBLIC_STROJ_SECRET_ACCESS_KEY,
      endpoint: process.env.NEXT_PUBLIC_STORJ_ENDPOINT,
      s3ForcePathStyle: true,
      signatureVersion: "v4",
      httpOptions: { timeout: 0 },
    });

    const file_key =
      "uploads/" + Date.now().toString() + file.name.replace(" ", "-");

    const params = {
      Bucket: process.env.NEXT_PUBLIC_STORJ_BUCKET_NAME!,
      Key: file_key,
      Body: file,
    };

    await s3
      .upload(params)
      .on("httpUploadProgress", (e) => {
        console.log(
          "uploading to storj... ",
          parseInt(((e.loaded * 100) / e.total).toString())
        );
      })
      .promise()
      .then(() => {
        console.log("successfully uploaded!", file_key);
      });

    return Promise.resolve({
      file_key,
      file_name: file.name,
    });
  } catch (error) {
    console.error(error);
  }
};
