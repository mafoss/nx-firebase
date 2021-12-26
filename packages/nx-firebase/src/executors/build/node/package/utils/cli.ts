import { ExecutorContext } from '@nrwl/devkit';

import {
  writeToFile
} from '@nrwl/workspace/src/utilities/fileutils';
import { readFileSync, writeFileSync } from 'fs';
import { chmodSync } from 'fs-extra';
import { NormalizedBuilderOptions } from './models';

export default function addCliWrapper(
  options: NormalizedBuilderOptions,
  context: ExecutorContext
) {
  const packageJson: Record<string, unknown> = JSON.parse(readFileSync(`${options.outputPath}/package.json`).toString());

  const binFile = `${options.outputPath}/index.bin.js`;
  writeToFile(
    binFile,
    `#!/usr/bin/env node
'use strict';

require('${packageJson.main}');
`
  );

  chmodSync(binFile, '755'); // Make the command-line file executable

  packageJson.bin = {
    [context.projectName]: './index.bin.js'
  };
  writeFileSync(`${options.outputPath}/package.json`, JSON.stringify(packageJson));
}
