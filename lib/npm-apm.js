'use babel';
'use strict';

function provideBuilder() {

  var fs = require('fs');
  var path = require('path');

  return {
    niceName: 'npm or apm',

    isEligable: function (cwd) {
      if (!fs.existsSync(path.join(cwd, 'package.json'))) {
        return false;
      }

      var realPackage = fs.realpathSync(path.join(cwd, 'package.json'));
      delete require.cache[realPackage];
      var pkg = require(realPackage);

      if (!pkg.engines || (!pkg.engines.atom && !pkg.engines.node)) {
        return false;
      }

      return true;
    },

    settings: function (cwd) {
      var realPackage = fs.realpathSync(path.join(cwd, 'package.json'));
      var pkg = require(realPackage);

      var executableExtension = /^win/.test(process.platform) ? '.cmd' : '';
      var config = [ {
        name: pkg.engines.node ? 'npm: default' : 'apm: default',
        exec: (pkg.engines.node ? 'npm' : 'apm') + executableExtension,
        args: [ '--color=always', 'install' ],
        sh: false
      } ];

      for (var script in pkg.scripts) {
        config.push({
          name: 'npm: ' + script,
          exec: 'npm',
          args: [ '--color=always', 'run', script ],
          sh: false
        });
      }

      function makeConfig(tool) {
        var _args = [];
        for (var i = 1; i<arguments.length; i++) {
          _args.push(arguments[i]);
        }

        return {
          name: tool + ': ' + _args.join(' '),
          exec: tool,
          args: _args,
          sh: false
        };
      }

      if (!pkg.engines.node) {
        config.push(
          makeConfig('apm', 'link'),
          makeConfig('apm', 'link', '--dev'),
          makeConfig('apm', 'publish', 'patch'),
          makeConfig('apm', 'publish', 'minor'),
          makeConfig('apm', 'publish', 'major'),
          makeConfig('apm', 'unlink'),
          makeConfig('apm', 'unlink', '--dev'),
          makeConfig('apm', 'upgrade', '--no-confirm'),
          makeConfig('apm', 'upgrade', '--list')
        );
      }

      config.push(
        makeConfig('npm', 'install'),
        makeConfig('npm', 'update')
        );

      if (pkg.engines.node) {
        config.push(
          makeConfig('npm', 'link'),
          makeConfig('npm', 'publish'),
          makeConfig('npm', 'unlink'),
          makeConfig('npm', 'version', 'patch'),
          makeConfig('npm', 'version', 'minor'),
          makeConfig('npm', 'version', 'major')
        );

      }

      return config;
    }
  };
}

module.exports.provideBuilder = provideBuilder;
