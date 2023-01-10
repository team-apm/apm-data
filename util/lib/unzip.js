import { path7za } from '7zip-bin';
import Seven from 'node-7z';
const { extractFull } = Seven;

export default async function unzip(zipPath, outputPath) {
  const zipStream = extractFull(zipPath, outputPath, {
    $bin: path7za,
    overwrite: 'a',
    method: ['cp=932'], // AviUtl script is encoded in Shift_JIS, so we need to specify the code page as Shift_JIS(932) when unzipping.
  });

  return new Promise((resolve) => {
    zipStream.once('end', () => {
      resolve();
    });
  });
}
