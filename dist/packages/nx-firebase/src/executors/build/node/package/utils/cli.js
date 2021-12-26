"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fileutils_1 = require("@nrwl/workspace/src/utilities/fileutils");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
function addCliWrapper(options, context) {
    const packageJson = JSON.parse(fs_1.readFileSync(`${options.outputPath}/package.json`).toString());
    const binFile = `${options.outputPath}/index.bin.js`;
    fileutils_1.writeToFile(binFile, `#!/usr/bin/env node
'use strict';

require('${packageJson.main}');
`);
    fs_extra_1.chmodSync(binFile, '755'); // Make the command-line file executable
    packageJson.bin = {
        [context.projectName]: './index.bin.js'
    };
    fs_1.writeFileSync(`${options.outputPath}/package.json`, JSON.stringify(packageJson));
}
exports.default = addCliWrapper;
//# sourceMappingURL=cli.js.map