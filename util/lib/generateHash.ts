import { createReadStream } from 'fs-extra';
import { fromStream } from 'ssri';

export default async function generateHash(path: string): Promise<string> {
  const readStream = createReadStream(path);
  const str = await fromStream(readStream, {
    algorithms: ['sha384'],
  });
  readStream.destroy();
  return str.toString();
}
