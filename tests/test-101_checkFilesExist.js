var assert = require('assert');
var path = require('path');
var cli = require('../lib/cli.js');

//
var casePath = './tests/cases';
function resolveCasePath(caseName, componentPath) {
	return path.resolve(casePath, caseName, componentPath);
}

//
describe('Check - Files Exist', function () {
	it('will recognize all existing files', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_files_exist', 'clean'),
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 0, 'got unexpected lint error(s)');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect missing "files"', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_files_exist', 'missing_files'),
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect missing "fonts"', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_files_exist', 'missing_fonts'),
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect missing "images"', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_files_exist', 'missing_images'),
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect missing "json"', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_files_exist', 'missing_json'),
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect missing "scripts"', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_files_exist', 'missing_scripts'),
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect missing "styles"', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_files_exist', 'missing_styles'),
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});

	it('will detect missing "templates"', function (done) {
		cli.execute([
			'node', path.resolve('./bin/component-hint'),
			resolveCasePath('check_files_exist', 'missing_templates'),
			'--reporter', 'devNull'
		], function (error, componentHint) {
			assert.ifError(error, 'cli#execute returned an error');
			assert.equal(componentHint.totalErrors, 1, 'did not get 1 lint error as expected');
			assert.equal(componentHint.totalWarnings, 0, 'got unexpected lint warning(s)');
			done();
		});
	});
});