// > yarn sri "C:\path\to\some.file"

import chalk from 'chalk';
import clipboardy from 'clipboardy';
import generateHash from './lib/generateHash';
const { yellowBright, green } = chalk;

async function generate(args: string[]) {
  const str = await generateHash(args[0]);
  console.log(yellowBright(str));
  void clipboardy.write(str);
  console.log(green('This hash has been copied in the clipboard!'));
}

const args = process.argv.slice(2);

if (args.length >= 1) {
  void generate(args);
} else {
  console.error('A path is required.');
}
