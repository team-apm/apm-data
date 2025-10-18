import fs from 'fs-extra';
import https from 'https';
import { dirname } from 'path';
const { createWriteStream, ensureDir } = fs;

export default async function download(url, archivePath) {
  return new Promise((resolve, reject) => {
    https.get(url, async (res) => {
      if (res.statusCode === 200) {
        await ensureDir(dirname(archivePath));
        const outArchive = createWriteStream(archivePath, 'binary');

        res
          .pipe(outArchive)
          .on('close', () => {
            outArchive.close(resolve);
          })
          .on('error', reject);
      } else if (res.statusCode === 302) {
        await download(res.headers.location, archivePath);
        resolve();
      }
    });
  });
}
