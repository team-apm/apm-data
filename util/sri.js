// > yarn sri "C:\path\to\some.file"

import chalk from 'chalk';
import clipboardy from 'clipboardy';
import fs from 'fs-extra';
import { fromStream } from 'ssri';
const { createReadStream } = fs;
const { yellowBright, green } = chalk;
const { write } = clipboardy;

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
