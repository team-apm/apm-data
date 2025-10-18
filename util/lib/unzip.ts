import { path7za } from '7zip-bin';
import { extractFull } from 'node-7z';

export default async function unzip(zipPath: string, outputPath: string) {
  const zipStream = extractFull(zipPath, outputPath, {
    $bin: path7za,
    overwrite: 'a',
  });

  return new Promise<void>((resolve) => {
    zipStream.once('end', () => {
      resolve();
    });
  });
}
