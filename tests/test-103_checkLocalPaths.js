var assert = require('assert');
var path = require('path');
var cli = require('../lib/cli.js');

//
var casePath = './tests/cases';
function resolveCasePath(caseName, componentPath) {
	return path.resolve(casePath, caseName, componentPath);
}

//
describe('Check - Local Paths', function () {
	it('should not fail', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_local_paths', 'clean'),
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 0, 'got unexpected lint error(s)');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will check if paths exist', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_local_paths', 'path_not_exist'),
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will check if paths are directories', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_local_paths', 'path_not_directory'),
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will ensure exists in given paths list', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_local_paths', 'not_inside_paths'),
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will ensure exists in only one path', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_local_paths', 'in_multiple_paths'),
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will check for unused paths', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_local_paths', 'unused_paths'),
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});
});