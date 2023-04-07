import { path7za } from '7zip-bin';
import Seven from 'node-7z';
const { extractFull } = Seven;

export default async function unzip(zipPath, outputPath) {
  const zipStream = extractFull(zipPath, outputPath, {
    $bin: path7za,
    overwrite: 'a',
  });

  return new Promise((resolve) => {
    zipStream.once('end', () => {
      resolve();
    });
  });
}
