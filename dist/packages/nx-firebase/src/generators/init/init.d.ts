import { Tree } from '@nrwl/devkit';
import { Schema } from './schema';
export declare function initGenerator(tree: Tree, schema: Schema): Promise<() => Promise<void>>;
export default initGenerator;
export declare const initSchematic: (options: Schema) => (tree: any, context: any) => Promise<any>;
