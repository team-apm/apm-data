// > yarn sri "C:\path\to\some.file"

const ssri = require('ssri');
const fs = require('fs-extra');
const chalk = require('chalk');
const clipboard = require('clipboardy');

async function generate(args) {
  const readStream = fs.createReadStream(args[0]);
  const str = await ssri.fromStream(readStream, {
    algorithms: ['sha384'],
  });
  console.log(chalk.yellowBright(str.toString()));
  clipboard.write(str.toString());
  console.log(chalk.green('This hash has been copied in the clipboard!'));
  readStream.destroy();
}

const args = process.argv.slice(2);

if (args.length >= 1) {
  generate(args);
} else {
  console.error('A pass is required.');
}
