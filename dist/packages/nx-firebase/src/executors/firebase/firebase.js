"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const path_1 = require("path");
const child_process_2 = require("child_process");
const rxjs_1 = require("rxjs");
function runFirebaseCli(args) {
    return new rxjs_1.Observable((subscriber) => {
        console.log("spawning: firebase " + args.join(' '));
        let errorCount = 0;
        // Run Firebase CLI command
        const child = child_process_1.spawn("firebase", args, { shell: true });
        // Run command
        child.stdout.on('data', (data) => {
            const decoded = data.toString();
            // eslint-disable-next-line no-control-regex
            if (decoded.match(/\x1Bc/g))
                return;
            if (decoded.includes('): error T')) {
                errorCount++;
                subscriber.next({ error: decoded });
            }
            else {
                subscriber.next({ info: decoded });
            }
        });
        child.stderr.on('error', (tscError) => {
            subscriber.next({ tscError });
        });
        child.stdout.on('end', () => {
            subscriber.next({
                info: `Type check complete. Found ${errorCount} errors`,
            });
        });
    });
}
/**
 * Experimental executor to wrap Firebase CLI with the --config <config> option auto-added for convenience
 * Not yet convinced this is actually adding value
 * @param options
 * @param context
 * @returns
 */
function runExecutor(options, context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log('Executor ran for Firebase', options);
        //const cwd = process.cwd()
        const projectRoot = context.root;
        const firebaseConfig = options.firebaseConfig;
        if (!firebaseConfig)
            throw Error();
        let cmd = options.cmd;
        if (!cmd)
            throw Error();
        if (cmd[0] === '"' && cmd[cmd.length - 1] === '"') {
            cmd = cmd.substring(1).slice(0, -1);
        }
        const config = path_1.join(projectRoot, firebaseConfig);
        console.log("projectRoot=" + projectRoot);
        console.log("firebaseConfig=" + firebaseConfig);
        console.log("cmd=" + cmd);
        console.log("config=" + config);
        // Run command
        //const command = join(projectRoot, )
        const args = cmd.split(' ');
        args.push('--config', config);
        const command = 'firebase ' + args.join(' ');
        console.log("running: " + command);
        let success = true;
        // Run Firebase CLI command
        try {
            const r = child_process_2.execSync(command);
            const out = r.toString();
            console.log(out);
        }
        catch (err) {
            success = false;
            const stdout = err.stdout.toString();
            const stderr = err.stderr.toString();
            console.error(stdout);
            console.error(stderr);
        }
        /*
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                success = false
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });
    */
        /*
            const child = spawn("firebase", args, { shell: true });
            child.stdout.on('data', (data) => {
              const decoded = data.toString();
              console.log(decoded)
            });
            child.stderr.on('error', (error) => {
              console.error(error.message)
              success = false
            });
            child.stdout.on('end', () => {
                console.log("Completed")
            });
            */
        return { success: success };
        /*
            return context.scheduleBuilder('@nrwl/workspace:run-commands', {
              cwd: frontendProjectRoot,
              parallel: false,
              commands: [
                {
                  command: `firebase ${cmd} --config "${config}"`,
                },
              ],
            });
          
      
      
        return {
          success: true,
        };
        */
    });
}
exports.default = runExecutor;
//# sourceMappingURL=firebase.js.map