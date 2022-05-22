// > yarn sri "C:\path\to\some.file"

import { fromStream } from 'ssri';
import fs from 'fs-extra';
const { createReadStream } = fs;
import chalk from 'chalk';
const { yellowBright, green } = chalk;
import { write } from 'clipboardy';

async function generate(args) {
  const readStream = createReadStream(args[0]);
  const str = await fromStream(readStream, {
    algorithms: ['sha384'],
  });
  console.log(yellowBright(str.toString()));
  write(str.toString());
  console.log(green('This hash has been copied in the clipboard!'));
  readStream.destroy();
}

const args = process.argv.slice(2);

if (args.length >= 1) {
  generate(args);
} else {
  console.error('A pass is required.');
}
