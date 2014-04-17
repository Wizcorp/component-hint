var fs = require('fs');
var path = require('path');
var async = require('async');

var helpers = require('./helpers.js');


// List of check functions located in the tests folder
var testFunctions = [
	require('./tests/checkLocalPaths.js').test,
	require('./tests/checkDependencies.js').test,
	require('./tests/checkFilesExist.js').test
];


/**
 * List of all components that have been checked, we keep this list so that the same components are
 * not checked twice.
 * @type type
 */
var lintedComponents = [];


/**
 * 
 * @param {type} checkPath
 * @param {type} cb
 * @returns {undefined}
 */
function loadData(checkPath, cb) {
	var componentJson;

	async.series([
		function (callback) {
			// Try and load the component.json file
			var componentFilename = path.join(checkPath, 'component.json');
			fs.exists(componentFilename, function (exists) {
				if (!exists) {
					return cb(new Error('Component JSON file does not exist: ' + componentFilename));
				}

				componentJson = require(componentFilename);
				return callback();
			});
		}
	], function (error) {
		if (error) {
			return cb(error);
		}

		return cb(null, {
			'ComponentJSON': componentJson
		});
	});
}


/**
 * 
 * @param {type} checkPath
 * @param {type} options
 * @param {type} lintOutputObj
 * @param {type} logChannel
 * @param {type} cb
 * @returns {undefined}
 */
exports.lintPath = function (checkPath, options, lintOutputObj, logChannel, cb) {
	var absolutePath = path.resolve(checkPath);
	var resolvedLocalPaths = [];
	var resolvedDepPaths = [];


	// Check if this component has already been linted
	if (lintedComponents.indexOf(absolutePath) >= 0) {
		return cb();
	}


	// Mark this path as checked
	lintedComponents.push(absolutePath);


	// Ensure log channel has been set
	logChannel = logChannel || 'error';

	// Initialize output object
	lintOutputObj[absolutePath] = {};
	var outputChannel = lintOutputObj[absolutePath][logChannel] = [];


	// Load all relevent data
	loadData(absolutePath, function (error, componentData) {
		if (error) {
			outputChannel.push(error.message);
			return cb();
		}

		// Begin the linting tests
		async.eachSeries(testFunctions, function (testFn, callback) {
			testFn(absolutePath, componentData, options, function (lintErrors, resolvedDeps) {
				resolvedLocalPaths.push.apply(resolvedLocalPaths, resolvedDeps || []);
				outputChannel.push.apply(outputChannel, lintErrors);
				return callback();
			});
		}, function () {
			if (!outputChannel.length) {
				delete lintOutputObj[absolutePath];
			}

			// If not recursive return results
			if (!options.recursive) {
				return cb();
			}

			// Otherwise recurse before returning the result
			async.forEachSeries(resolvedLocalPaths, function (depPath, callback) {
				exports.lintPath(depPath, options, lintOutputObj, logChannel, callback);
			}, function () {
				if (options.warnOnDeps) {
					logChannel = 'warning';
				}

				async.forEachSeries(resolvedDepPaths, function (depPath, callback) {
					exports.lintPath(depPath, options, lintOutputObj, logChannel, callback);
				}, cb);
			});
		});
	});
};