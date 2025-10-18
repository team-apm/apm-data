import fs from 'fs-extra';
import { fromStream } from 'ssri';
const { createReadStream } = fs;

export default async function generateHash(path) {
  const readStream = createReadStream(path);
  const str = await fromStream(readStream, {
    algorithms: ['sha384'],
  });
  readStream.destroy();
  return str.toString();
}
