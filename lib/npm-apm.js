'use babel';

import fs from 'fs';
import path from 'path';

export function provideBuilder() {
  return class NpmApmBuildProvider {
    constructor(cwd) {
      this.cwd = cwd;
    }
    getNiceName() {
      return 'npm or apm';
    }

    isEligible() {
      if (!fs.existsSync(path.join(this.cwd, 'package.json'))) {
        return false;
      }

      const realPackage = fs.realpathSync(path.join(this.cwd, 'package.json'));
      delete require.cache[realPackage];
      const pkg = require(realPackage);

      if (!pkg.engines || (!pkg.engines.atom && !pkg.engines.node)) {
        return false;
      }

      return true;
    }

    settings() {
      const realPackage = fs.realpathSync(path.join(this.cwd, 'package.json'));
      delete require.cache[realPackage];
      const pkg = require(realPackage);

      const executableExtension = /^win/.test(process.platform) ? '.cmd' : '';
      // https://github.com/mochajs/mocha/issues/1844
      const env = {FORCE_COLOR: '1', MOCHA_COLORS: '1'};
      const config = [ {
        name: pkg.engines.node ? 'npm: default' : 'apm: default',
        exec: (pkg.engines.node ? 'npm' : 'apm') + executableExtension,
        args: [ 'install' ],
        env: env,
        sh: false
      } ];

      for (const script in pkg.scripts) {
        if (pkg.scripts.hasOwnProperty(script)) {
          config.push({
            name: 'npm: ' + script,
            exec: 'npm' + executableExtension,
            args: [ 'run', script ],
            env: env,
            sh: false
          });
        }
      }
      return config;
    }
  };
}
