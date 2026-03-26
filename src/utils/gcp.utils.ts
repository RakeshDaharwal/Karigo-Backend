import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { env } from "../config/env";

const storage = new Storage({
  keyFilename: path.resolve(env.GCP_KEY_FILE),
});

const bucketName = env.GCP_BUCKET_NAME.trim() || "karigo";
const bucket = storage.bucket(bucketName);

export const uploadToGCP = async (file: Express.Multer.File) => {
  const fileName = `profile/${uuidv4()}-${file.originalname}`;

  const blob = bucket.file(fileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: file.mimetype,
  });

  return new Promise<string>((resolve, reject) => {
    blobStream.on("error", reject);

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};