import { storageBuckets } from '@/lib/supabase/storage';

export function buildSessionImportStoragePath(input: {
  ownerUserId: string;
  fileName: string;
  sourceFileHash: string;
  uploadId: string;
}) {
  const sanitizedFileName = input.fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const normalizedFileName = sanitizedFileName || 'session.xml';

  return {
    bucket: storageBuckets.sessionImports,
    path: `${input.ownerUserId}/${input.uploadId}-${input.sourceFileHash}-${normalizedFileName}`,
  };
}
