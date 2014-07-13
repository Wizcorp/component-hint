var assert = require('assert');
var path = require('path');
var cli = require('../lib/cli.js');

//
var casePath = './tests/cases';
function resolveCasePath(caseName, componentPath) {
	return path.resolve(casePath, caseName, componentPath);
}

//
var depPaths = [
	resolveCasePath('check_dependencies', 'components'),
	resolveCasePath('check_dependencies', 'components2')
].join(':');

//
describe('Check - Dependencies', function () {
	it('should not fail', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_dependencies', 'clean'),
			'-d', depPaths,
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 0, 'got unexpected lint error(s)');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect missing dependencies', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_dependencies', 'missing_dependencies'),
			'-d', depPaths,
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect duplicate dependencies', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_dependencies', 'duplicate_dependencies'),
			'-d', depPaths,
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect self dependencies', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_dependencies', 'self_dependency'),
			'-d', depPaths,
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will check if dependencies required at multiple versions', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_dependencies', 'multiple_versions'),
			'-d', depPaths,
			'--recursive',
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it.only('only warn on dependencies listed on --warn-paths', function (done) {
		var warnPaths = [
			resolveCasePath('check_dependencies', 'components'),
			resolveCasePath('check_dependencies', 'components2')
		].join(':');
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_dependencies', 'self_dependency'),
			'-d', depPaths,
			'--recursive',
			'--reporter', 'devNull',
			'--warn-paths', warnPaths,
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 0, 'got unexpected lint error(s)');
			assert.equal(componentHint.totalWarnings, 1, 'did not get 1 lint error as expected');
			done();
		});
	});
});