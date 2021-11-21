"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSchematic = exports.initGenerator = void 0;
const tslib_1 = require("tslib");
const devkit_1 = require("@nrwl/devkit");
const set_default_collection_1 = require("@nrwl/workspace/src/utilities/set-default-collection");
const jest_1 = require("@nrwl/jest");
function updateDependencies(tree) {
    //SM: nrwl plugins auto update their plugins here, we don't need to do that.
    /*
    updateJson(tree, 'package.json', (json) => {
      delete json.dependencies['@nrwl/node'];
      return json;
    });
    */
    // instead we just add the firebase dependencies
    // we'll use "latest" so we dont have to keep versions of the plugin tracked to firebase versions
    return devkit_1.addDependenciesToPackageJson(tree, {
        'firebase-admin': 'latest',
        'firebase-functions': 'latest' //"^3.11.0"
    }, {
    //'@nrwl/node': nxVersion 
    });
}
function normalizeOptions(schema) {
    var _a;
    return Object.assign(Object.assign({}, schema), { unitTestRunner: (_a = schema.unitTestRunner) !== null && _a !== void 0 ? _a : 'jest' });
}
function initGenerator(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = normalizeOptions(schema);
        set_default_collection_1.setDefaultCollection(tree, '@nrwl/node');
        let jestInstall;
        if (options.unitTestRunner === 'jest') {
            jestInstall = yield jest_1.jestInitGenerator(tree, {});
        }
        const installTask = yield updateDependencies(tree);
        if (!options.skipFormat) {
            yield devkit_1.formatFiles(tree);
        }
        return () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (jestInstall) {
                yield jestInstall();
            }
            yield installTask();
        });
    });
}
exports.initGenerator = initGenerator;
exports.default = initGenerator;
exports.initSchematic = devkit_1.convertNxGenerator(initGenerator);
//# sourceMappingURL=init.js.map