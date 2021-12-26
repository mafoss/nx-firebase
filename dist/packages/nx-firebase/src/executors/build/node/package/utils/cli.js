"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devkit_1 = require("@nrwl/devkit");
const fileutils_1 = require("@nrwl/workspace/src/utilities/fileutils");
const fs_extra_1 = require("fs-extra");
function addCliWrapper(options, context) {
    const packageJson = devkit_1.readJsonFile(`${options.outputPath}/package.json`);
    const binFile = `${options.outputPath}/index.bin.js`;
    fileutils_1.writeToFile(binFile, `#!/usr/bin/env node
'use strict';

require('${packageJson.main}');
`);
    fs_extra_1.chmodSync(binFile, '755'); // Make the command-line file executable
    packageJson.bin = {
        [context.projectName]: './index.bin.js'
    };
    devkit_1.writeJsonFile(`${options.outputPath}/package.json`, packageJson);
}
exports.default = addCliWrapper;
//# sourceMappingURL=cli.js.map