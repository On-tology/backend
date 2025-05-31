// src/s3/s3.service.ts
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
  } from '@aws-sdk/client-s3';
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  import { Injectable } from '@nestjs/common';
  import { Readable } from 'stream';
  
  @Injectable()       
  export class S3Service {
    private client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      endpoint: process.env.AWS_S3_ENDPOINT, 
      forcePathStyle: true,
    });
  
    private bucket = process.env.AWS_S3_BUCKET!;
  
    async upload(key: string, body: Buffer, mime = 'application/octet-stream') {
      const cmd = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mime,
      });
      await this.client.send(cmd);
      return { key };
    }
  
    async stream(key: string): Promise<Readable> {
      const { Body } = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return Body as Readable;
    }
  
    async presign(key: string, expires = 300) {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      return getSignedUrl(this.client, cmd, { expiresIn: expires });
    }
  }
  