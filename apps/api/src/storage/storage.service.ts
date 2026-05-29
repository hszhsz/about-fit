import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import cuid from 'cuid';

export type BucketKind = 'uploads' | 'renders';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly endpoint: string;
  private readonly bucketUploads: string;
  private readonly bucketRenders: string;
  private readonly publicEndpoint: string;

  constructor(private readonly config: ConfigService) {
    this.endpoint = this.config.get<string>('S3_ENDPOINT') ?? 'http://localhost:9000';
    this.publicEndpoint =
      this.config.get<string>('S3_PUBLIC_ENDPOINT') ?? this.endpoint;
    this.bucketUploads =
      this.config.get<string>('S3_BUCKET_UPLOADS') ?? 'about-fit-uploads';
    this.bucketRenders =
      this.config.get<string>('S3_BUCKET_RENDERS') ?? 'about-fit-renders';

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY') ?? 'aboutfit',
        secretAccessKey:
          this.config.get<string>('S3_SECRET_KEY') ?? 'aboutfit-dev-secret',
      },
      forcePathStyle: true, // required for MinIO
    });
  }

  private bucketName(kind: BucketKind): string {
    return kind === 'renders' ? this.bucketRenders : this.bucketUploads;
  }

  /**
   * Returns a unique S3 key like `garments/abc123.jpg`.
   */
  generateKey(prefix: string, ext: string): string {
    const cleanExt = ext.replace(/^\./, '').toLowerCase();
    return `${prefix}/${cuid()}.${cleanExt}`;
  }

  /**
   * Returns the public read URL for an object.
   * The renders bucket is configured for anonymous download in docker-compose.
   */
  getPublicUrl(key: string, bucket: BucketKind = 'uploads'): string {
    return `${this.publicEndpoint}/${this.bucketName(bucket)}/${key}`;
  }

  /**
   * Generates a presigned PUT URL the frontend can use to upload directly to S3.
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    bucket: BucketKind = 'uploads',
    expiresInSec = 600,
  ): Promise<{ url: string; publicUrl: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName(bucket),
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn: expiresInSec });
    return {
      url,
      publicUrl: this.getPublicUrl(key, bucket),
      key,
    };
  }

  /**
   * Server-side upload (used by the worker after AI generation).
   */
  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
    bucket: BucketKind = 'renders',
  ): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName(bucket),
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    const publicUrl = this.getPublicUrl(key, bucket);
    this.logger.log(`Uploaded ${buffer.length} bytes → ${publicUrl}`);
    return publicUrl;
  }

  /**
   * Generates a presigned GET URL (for private buckets).
   */
  async getPresignedDownloadUrl(
    key: string,
    bucket: BucketKind = 'uploads',
    expiresInSec = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName(bucket),
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSec });
  }
}
