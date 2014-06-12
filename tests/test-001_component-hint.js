var assert = require('assert');
var path = require('path');
var ComponentHint = require('../lib/component-hint.js');

//
var casePath = './tests/cases';
function resolveCasePath(caseName, componentPath) {
	return path.resolve(casePath, caseName, componentPath);
}

//
describe('ComponentHint Class', function () {
	it('could create instance', function () {
		new ComponentHint();
	});

	it('could load component data', function (done) {
		var componentHint = new ComponentHint();
		componentHint.loadComponentData(resolveCasePath('case-clean', 'component_A'), false, function (error, data) {
			assert.ifError(error, 'ComponentHint#loadComponentData returned an error');

			assert.deepEqual(data, {
				path: resolveCasePath('case-clean', 'component_A'),
				json: {
					name: 'component_A',
					dependencies: { dependencyA: '*', dependencyB: '*'},
					local: ['component_B'],
					paths: ['..'],
					styles: [],
					scripts: []
				},
				channel: 'lint.error'
			}, 'ComponentHint#loadComponentData returned incorrect data');

			done();
		});
	});

	it('could load recursively', function (done) {
		var componentHint = new ComponentHint({
			depPaths: resolveCasePath('case-clean', 'components'),
			recursive: true
		});

		componentHint.checkPaths(resolveCasePath('case-clean', 'component_A'), false, function () {
			assert.equal(componentHint.lintedComponents.length, 4, 'ComponentHint#checkPaths didn\'t load all components & dependencies');
			done();
		});
	});
});