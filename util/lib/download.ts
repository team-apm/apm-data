import { createWriteStream, ensureDir } from 'fs-extra';
import https from 'https';
import { dirname } from 'path';

export default async function download(url: string, archivePath: string) {
  return new Promise<void>((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        void ensureDir(dirname(archivePath)).then(() => {
          const outArchive = createWriteStream(archivePath, 'binary');

          res
            .pipe(outArchive)
            .on('close', () => {
              outArchive.close(() => resolve());
            })
            .on('error', reject);
        });
      } else if (res.statusCode === 302 && res.headers.location) {
        void download(res.headers.location, archivePath).then(() => resolve());
      }
    });
  });
}
