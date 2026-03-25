import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./config";

// Constants
const BUCKET_NAME = "actup-resources";  // Replace with your actual bucket name

export class S3Service {
  /**
   * Upload a file to S3
   * @param key - The key (path) where the file will be stored
   * @param body - The file content
   * @param contentType - The MIME type of the file
   */
  async uploadFile(key: string, body: Buffer | string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  }

  /**
   * Get a file from S3
   * @param key - The key (path) of the file to retrieve
   */
  async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const stream = response.Body;
    
    if (!stream) {
      throw new Error("File not found");
    }
    
    // Convert stream to buffer
    return Buffer.from(await new Response(stream as ReadableStream).arrayBuffer());
  }

  /**
   * Generate a pre-signed download URL for a file
   * @param key - The key (path) of the file
   * @param originalFileName - The original file name (for Content-Disposition header)
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   */
  async getDownloadUrl(key: string, originalFileName?: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: originalFileName 
        ? `attachment; filename="${encodeURIComponent(originalFileName)}"` 
        : undefined
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Delete a file from S3
   * @param key - The key (path) of the file to delete
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * List files in a directory (prefix) in S3
   * @param prefix - The directory prefix to list files from
   */
  async listFiles(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return (response.Contents || []).map(item => item.Key || "");
  }
}

export const s3Service = new S3Service();