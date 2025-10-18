// > yarn sri "C:\path\to\some.file"

import chalk from 'chalk';
import clipboardy from 'clipboardy';
import generateHash from './lib/generateHash.js';
const { yellowBright, green } = chalk;
const { write } = clipboardy;

async function generate(args) {
  const str = await generateHash(args[0]);
  console.log(yellowBright(str));
  write(str);
  console.log(green('This hash has been copied in the clipboard!'));
}

const args = process.argv.slice(2);

if (args.length >= 1) {
  generate(args);
} else {
  console.error('A path is required.');
}
