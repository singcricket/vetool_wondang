import { S3Client } from '@aws-sdk/client-s3'

const endpoint = process.env.R2_END_POINT
const accessKeyId = process.env.R2_ACCESS_KEY
const secretAccessKey = process.env.R2_SECRET_KEY

export const R2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint || 'https://placeholder.endpoint', // 빌드 타임용 더미 주소
  credentials: {
    accessKeyId: accessKeyId || 'placeholder',
    secretAccessKey: secretAccessKey || 'placeholder',
  },
  forcePathStyle: true,
})
