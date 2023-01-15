import { path7za } from '7zip-bin';
import Seven from 'node-7z';
import { execFileSync } from 'child_process';
const { extractFull } = Seven;

const isLinux = process.platform === 'linux';
// NOTE
// On Linux, 7zip assumes utf8 by default. Use the C locale instead.
// $LANG=C node THIS_FUNCTION.js
// or $LANG=C yarn run THIS_FUNCTION.js
//
// To run this file on Linux, you must install `convmv`.

export default async function unzip(zipPath, outputPath) {
  const zipStream = extractFull(zipPath, outputPath, {
    $bin: path7za,
    overwrite: 'a',
  });

  return new Promise((resolve) => {
    zipStream.once('end', () => {
      if (isLinux)
        execFileSync('convmv', [
          ...'-f shift_jis -t utf8 -r --notest'.split(' '),
          outputPath,
        ]); // Convert file names to utf8 on Linux.
      resolve();
    });
  });
}
