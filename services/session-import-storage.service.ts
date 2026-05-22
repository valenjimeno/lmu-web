import { createClient } from '@/lib/supabase/server';

type DownloadSessionImportSourceInput = {
  bucket: string;
  path: string;
};

export async function downloadSessionImportSourceXml(input: DownloadSessionImportSourceInput) {
  const supabase = await createClient();
  const result = await supabase.storage.from(input.bucket).download(input.path);

  if (result.error) {
    throw result.error;
  }

  return result.data.text();
}
