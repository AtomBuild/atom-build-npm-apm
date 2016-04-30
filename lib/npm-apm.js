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
      return fs.existsSync(path.join(this.cwd, 'package.json'));
    }

    settings() {
      const realPackage = fs.realpathSync(path.join(this.cwd, 'package.json'));
      delete require.cache[realPackage];
      const pkg = require(realPackage);

      // https://github.com/mochajs/mocha/issues/1844
      const env = {FORCE_COLOR: '1', MOCHA_COLORS: '1', NPM_CONFIG_COLOR: 'always'};
      const errorMatch = [
        '\\n(?<file>.+):(?<line>\\d+)\\n  ',               // First line
        '\\((?<file>[^(]+):(?<line>\\d+):(?<col>\\d+)\\)'  // Stack trace
      ];
      const config = [ {
        name: pkg.engines && pkg.engines.atom ? 'apm: install' : 'npm: install',
        exec: (pkg.engines && pkg.engines.atom ? 'apm' : 'npm'),
        args: [ 'install' ],
        env: env,
        errorMatch: errorMatch,
        sh: false
      } ];

      for (const script in pkg.scripts) {
        if (pkg.scripts.hasOwnProperty(script)) {
          config.push({
            name: 'npm: ' + script,
            exec: 'npm',
            args: [ 'run', script ],
            env: env,
            errorMatch: errorMatch,
            sh: false
          });
        }
      }
      return config;
    }
  };
}
