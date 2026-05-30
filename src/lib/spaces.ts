import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const DIR = process.env.DO_SPACES_DIR ?? 'fixam-rev';

let _spacesClient: S3Client | null = null;
function getSpacesClient(): S3Client {
  if (!_spacesClient) {
    _spacesClient = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT!,
      region: process.env.DO_SPACES_REGION!,
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
      },
      forcePathStyle: false,
    });
  }
  return _spacesClient;
}

/**
 * Upload a file buffer to DigitalOcean Spaces.
 * Returns the public CDN URL of the uploaded file.
 */
export async function uploadToSpaces(
  file: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
  subfolder: string = 'products',
): Promise<string> {
  const key = `${DIR}/${subfolder}/${fileName}`;

  await getSpacesClient().send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  );

  const cdn = process.env.DO_SPACES_CDN_ENDPOINT?.replace(/\/$/, '');
  if (cdn) return `${cdn}/${key}`;

  // Fallback to direct Spaces URL if no CDN configured
  const endpoint = process.env.DO_SPACES_ENDPOINT?.replace(/\/$/, '');
  const bucket = process.env.DO_SPACES_BUCKET;
  return `${endpoint}/${bucket}/${key}`;
}

/**
 * Delete a file from DigitalOcean Spaces by its full URL.
 */
export async function deleteFromSpaces(fileUrl: string): Promise<boolean> {
  try {
    // Extract key from URL
    const cdn = process.env.DO_SPACES_CDN_ENDPOINT?.replace(/\/$/, '');
    const endpoint = process.env.DO_SPACES_ENDPOINT?.replace(/\/$/, '');
    const bucket = process.env.DO_SPACES_BUCKET;

    let key: string | undefined;

    if (cdn && fileUrl.startsWith(cdn)) {
      key = fileUrl.replace(`${cdn}/`, '');
    } else if (endpoint && bucket && fileUrl.startsWith(`${endpoint}/${bucket}/`)) {
      key = fileUrl.replace(`${endpoint}/${bucket}/`, '');
    }

    if (!key) return false;

    await getSpacesClient().send(
      new DeleteObjectCommand({
        Bucket: bucket!,
        Key: key,
      }),
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a unique file name for upload.
 */
export function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop() ?? 'bin';
  const rand = Math.random().toString(36).substring(2, 10);
  return `${Date.now()}-${rand}.${ext}`;
}
