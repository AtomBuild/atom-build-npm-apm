'use babel';

import temp from 'temp';
import fs from 'fs-extra';
import { vouch } from 'atom-build-spec-helpers';
import { provideBuilder } from '../lib/npm-apm';

describe('npm apm provider', () => {
  let directory;
  let builder;
  const Builder = provideBuilder();

  beforeEach(() => {
    waitsForPromise(() => {
      return vouch(temp.mkdir, 'atom-build-spec-npm-apm-')
        .then((dir) => vouch(fs.realpath, dir))
        .then((dir) => directory = `${dir}/`)
        .then((dir) => builder = new Builder(dir));
    });
  });

  afterEach(() => {
    fs.removeSync(directory);
  });

  describe('when package.json with node engine exists', () => {
    it('should be eligible', () => {
      fs.writeFileSync(`${directory}/package.json`, fs.readFileSync(`${__dirname}/package.json.node`));
      expect(builder.isEligible()).toBe(true);
    });

    it('should provide default targets along with scripts', () => {
      fs.writeFileSync(`${directory}/package.json`, fs.readFileSync(`${__dirname}/package.json.node`));
      expect(builder.isEligible()).toBe(true);
      waitsForPromise(() => {
        return Promise.resolve(builder.settings()).then(settings => {
          expect(settings.length).toBe(2);

          const defaultTarget = settings.find(s => s.name === 'npm: install');
          expect(defaultTarget.exec).toBe('npm');
          expect(defaultTarget.sh).toBe(false);
          expect(defaultTarget.args).toEqual([ 'install' ]);

          const customTarget = settings.find(s => s.name === 'npm: custom script');
          expect(customTarget.exec).toBe('npm');
          expect(customTarget.sh).toBe(false);
          expect(customTarget.args).toEqual([ 'run', 'custom script' ]);
        });
      });
    });
  });

  describe('when package.json with apm engine', () => {
    it('should be eligible', () => {
      fs.writeFileSync(`${directory}/package.json`, fs.readFileSync(`${__dirname}/package.json.atom`));
      expect(builder.isEligible()).toBe(true);
    });

    it('should provide default targets along with scripts', () => {
      fs.writeFileSync(`${directory}/package.json`, fs.readFileSync(`${__dirname}/package.json.atom`));
      expect(builder.isEligible()).toBe(true);
      waitsForPromise(() => {
        return Promise.resolve(builder.settings()).then(settings => {
          expect(settings.length).toBe(2);

          const defaultTarget = settings.find(s => s.name === 'apm: install');
          expect(defaultTarget.exec).toBe('apm');
          expect(defaultTarget.sh).toBe(false);
          expect(defaultTarget.args).toEqual([ 'install' ]);

          const customTarget = settings.find(s => s.name === 'npm: custom script');
          expect(customTarget.exec).toBe('npm');
          expect(customTarget.sh).toBe(false);
          expect(customTarget.args).toEqual([ 'run', 'custom script' ]);
        });
      });
    });
  });

  describe('when package.json exists, but no engines', () => {
    it('should be eligible', () => {
      fs.writeFileSync(`${directory}/package.json`, fs.readFileSync(`${__dirname}/package.json.noengine`));
      expect(builder.isEligible()).toBe(true);
    });

    it('should use it with npm', () => {
      fs.writeFileSync(`${directory}/package.json`, fs.readFileSync(`${__dirname}/package.json.noengine`));
      expect(builder.isEligible()).toBe(true);
      waitsForPromise(() => {
        return Promise.resolve(builder.settings()).then(settings => {
          expect(settings.length).toBe(1);

          const defaultTarget = settings.find(s => s.name === 'npm: install');
          expect(defaultTarget.exec).toBe('npm');
          expect(defaultTarget.sh).toBe(false);
          expect(defaultTarget.args).toEqual([ 'install' ]);
        });
      });
    });
  });

  describe('when no package.json exists', () => {
    it('should not be eligible', () => {
      expect(builder.isEligible()).toBe(false);
    });
  });

  describe('when package.json is altered', () => {
    it('should update targets', () => {
      const pkg = JSON.parse(fs.readFileSync(`${__dirname}/package.json.node`));
      fs.writeFileSync(`${directory}/package.json`, JSON.stringify(pkg));

      expect(builder.isEligible()).toBe(true);

      waitsForPromise(() => {
        return Promise.resolve(builder.settings()).then(settings => {
          expect(settings.length).toBe(2);
        });
      });

      // FileWatcher isn't always ready when it returns, depending
      // on OS and probably other factors. There doesn't seem to be
      // a reliable way to know, so just wait a little bit.
      waits(1000);

      waitsForPromise(() => new Promise(resolve => {
        builder.on('refresh', resolve);
        pkg.scripts = { 'task': 'echo all the things' };
        fs.writeFileSync(`${directory}/package.json`, JSON.stringify(pkg));
      }));

      waitsForPromise(() => {
        return Promise.resolve(builder.settings()).then(settings => {
          expect(settings.length).toBe(2);

          const target = settings.find(s => s.name === 'npm: task');
          expect(target.exec).toBe('npm');
          expect(target.sh).toBe(false);
          expect(target.args).toEqual([ 'run', 'task' ]);
        });
      });
    });
  });
});
