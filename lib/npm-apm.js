'use babel';

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

export function provideBuilder() {
  return class NpmApmBuildProvider extends EventEmitter {
    constructor(cwd) {
      super();
      this.cwd = cwd;
      this.fileWatcher = null;
    }

    destructor() {
      this.fileWatcher && this.fileWatcher.close();
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

      const file = path.join(this.cwd, 'package.json');
      this.fileWatcher && this.fileWatcher.close();
      this.fileWatcher = (require('os').platform() === 'linux' ? fs.watchFile : fs.watch)(file, () => {
        this.emit('refresh');
      });

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
