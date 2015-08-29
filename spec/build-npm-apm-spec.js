'use strict';

var temp = require('temp');
var _ = require('lodash');
var fs = require('fs-extra');
var specHelpers = require('atom-build-spec-helpers');

describe('gulp provider', function() {
  var directory;
  var workspaceElement;

  beforeEach(function () {
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);
    jasmine.unspy(window, 'setTimeout');
    jasmine.unspy(window, 'clearTimeout');

    waitsForPromise(function() {
      return specHelpers.vouch(temp.mkdir, 'atom-build-npm-apm-spec-').then(function (dir) {
        return specHelpers.vouch(fs.realpath, dir);
      }).then(function (dir) {
        directory = dir + '/';
        atom.project.setPaths([ directory ]);
      }).then(function () {
        return Promise.all([
          atom.packages.activatePackage('build'),
          atom.packages.activatePackage('build-npm-apm')
        ]);
      });
    });
  });

  afterEach(function() {
    fs.removeSync(directory);
  });

  it('should show the build window if it is node engine', function() {
    expect(workspaceElement.querySelector('.build')).not.toExist();

    fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.node'));
    atom.commands.dispatch(workspaceElement, 'build:trigger');

    waitsFor(function() {
      return workspaceElement.querySelector('.build .title') &&
        workspaceElement.querySelector('.build .title').classList.contains('success');
    });

    runs(function() {
      expect(workspaceElement.querySelector('.build')).toExist();
      expect(workspaceElement.querySelector('.build .output').textContent).toMatch(/^Executing: npm/);
    });
  });

  it('should show the build window if it is atom engine', function() {
    if (process.env.TRAVIS) {
      return;
    }

    expect(workspaceElement.querySelector('.build')).not.toExist();

    fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.atom'));
    atom.commands.dispatch(workspaceElement, 'build:trigger');

    waitsFor(function() {
      return workspaceElement.querySelector('.build .title') &&
        workspaceElement.querySelector('.build .title').classList.contains('success');
    }, 'build to be successful', 10000);

    runs(function() {
      expect(workspaceElement.querySelector('.build')).toExist();
      expect(workspaceElement.querySelector('.build .output').textContent).toMatch(/^Executing: apm/);
    });
  });

  it('should not do anything if engines are not available in the file', function() {
    expect(workspaceElement.querySelector('.build')).not.toExist();

    fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.noengine'));
    atom.commands.dispatch(workspaceElement, 'build:trigger');

    waits(1000);

    runs(function() {
      expect(workspaceElement.querySelector('.build')).not.toExist();
    });
  });

  it('should list scripts as build targets', function () {
    expect(workspaceElement.querySelector('.build')).not.toExist();

    fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.node'));
    runs(function () {
      atom.commands.dispatch(workspaceElement, 'build:select-active-target');
    });

    waitsFor(function () {
      return workspaceElement.querySelector('.select-list li.build-target');
    });

    runs(function () {
      var targets = _.map(workspaceElement.querySelectorAll('.select-list li.build-target'), function (el) {
        return el.textContent;
      });
      expect(targets).toEqual([ 'npm: default', 'npm: custom script' ]);
    });
  });

  it('should list package.json files with engine atom scripts as run by NPM', function () {
    expect(workspaceElement.querySelector('.build')).not.toExist();

    fs.writeFileSync(directory + 'package.json', fs.readFileSync(__dirname + '/package.json.atom'));
    runs(function () {
      atom.commands.dispatch(workspaceElement, 'build:select-active-target');
    });

    waitsFor(function () {
      return workspaceElement.querySelector('.select-list li.build-target');
    });

    runs(function () {
      var targets = _.map(workspaceElement.querySelectorAll('.select-list li.build-target'), function (el) {
        return el.textContent;
      });
      expect(targets).toEqual([ 'apm: default', 'npm: custom script' ]);
    });
  });
});
