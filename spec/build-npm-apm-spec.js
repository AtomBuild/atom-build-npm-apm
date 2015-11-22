'use babel';

import temp from 'temp';
import _ from 'lodash';
import fs from 'fs-extra';
import specHelpers from 'atom-build-spec-helpers';

describe('npm-apm provider', () => {
  let directory;
  let workspaceElement;

  beforeEach( () => {
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);
    jasmine.unspy(window, 'setTimeout');
    jasmine.unspy(window, 'clearTimeout');

    atom.notifications.clear();
    waitsForPromise(() => {
      return Promise.resolve()
        .then(() => specHelpers.vouch(temp.mkdir, 'atom-build-npm-apm-spec-'))
        .then((dir) => specHelpers.vouch(fs.realpath, dir))
        .then((dir) => atom.project.setPaths([ directory = dir + '/' ]))
        .then(() => specHelpers.activate('build-npm-apm'));
    });
  });

  afterEach(() => {
    fs.removeSync(directory);
  });

  it('should show the build window if it is node engine', () => {
    expect(workspaceElement.querySelector('.build')).not.toExist();

    fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.node'));

    waitsForPromise(() => specHelpers.refreshAwaitTargets());

    runs(() => atom.commands.dispatch(workspaceElement, 'build:trigger'));

    waitsFor(() => {
      return workspaceElement.querySelector('.build .title') &&
        workspaceElement.querySelector('.build .title').classList.contains('success');
    });

    runs(() => {
      expect(workspaceElement.querySelector('.build')).toExist();
      expect(workspaceElement.querySelector('.build .output').textContent).toMatch(/^Executing: npm/);
    });
  });

  it('should show the build window if it is atom engine', () => {
    if (process.env.TRAVIS) {
      return;
    }

    expect(workspaceElement.querySelector('.build')).not.toExist();

    runs(() => fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.atom')));

    waitsForPromise(() => specHelpers.refreshAwaitTargets());

    runs(() => atom.commands.dispatch(workspaceElement, 'build:trigger'));

    waitsFor(() => {
      return workspaceElement.querySelector('.build .title') &&
        workspaceElement.querySelector('.build .title').classList.contains('success');
    }, 'build to be successful', 10000);

    runs(() => {
      expect(workspaceElement.querySelector('.build')).toExist();
      expect(workspaceElement.querySelector('.build .output').textContent).toMatch(/^Executing: apm/);
    });
  });

  it('should not do anything if engines are not available in the file', () => {
    expect(workspaceElement.querySelector('.build')).not.toExist();

    fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.noengine'));

    waitsForPromise(() => specHelpers.refreshAwaitTargets());

    runs(() => atom.commands.dispatch(workspaceElement, 'build:trigger'));

    waits(1000);

    runs(() => {
      expect(workspaceElement.querySelector('.build')).not.toExist();
    });
  });

  it('should list scripts as build targets', () => {
    expect(workspaceElement.querySelector('.build')).not.toExist();

    fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.node'));

    waitsForPromise(() => specHelpers.refreshAwaitTargets());

    runs(() => atom.commands.dispatch(workspaceElement, 'build:select-active-target'));

    waitsFor( () => {
      return workspaceElement.querySelector('.select-list li.build-target');
    });

    runs( () => {
      const targets = [...workspaceElement.querySelectorAll('.select-list li.build-target')].map(el => el.textContent);
      expect(targets).toEqual([ 'npm: default', 'npm: custom script' ]);
    });
  });

  it('should list package.json files with engine atom scripts as run by NPM', () => {
    expect(workspaceElement.querySelector('.build')).not.toExist();

    fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.atom'));

    waitsForPromise(() => specHelpers.refreshAwaitTargets());

    runs(() => atom.commands.dispatch(workspaceElement, 'build:select-active-target'));

    waitsFor( () => {
      return workspaceElement.querySelector('.select-list li.build-target');
    });

    runs( () => {
      const targets = _.map(workspaceElement.querySelectorAll('.select-list li.build-target'), (el) => {
        return el.textContent;
      });
      expect(targets).toEqual([ 'apm: default', 'npm: custom script' ]);
    });
  });
});
