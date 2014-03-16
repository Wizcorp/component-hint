var fs = require('fs');
var path = require('path');
var async = require('async');

var helpers = require('./helpers.js');


// List of check functions located in the tests folder
var checkLocalPaths = require('./tests/checkLocalPaths.js').test;


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
 * @param {type} lookupPaths
 * @param {type} recursive
 * @param {type} lintErrorsObj
 * @param {type} cb
 * @returns {undefined}
 */
exports.lintPath = function (checkPath, lookupPaths, recursive, lintErrorsObj, cb) {
	var absolutePath = path.resolve(checkPath);
	var resolvedDepPaths = [];

	// Check if this component has already been linted
	if (lintedComponents.indexOf(absolutePath) >= 0) {
		return cb();
	}

	// Mark this path as checked
	lintedComponents.push(absolutePath);

	// Load all relevent data
	loadData(absolutePath, function (error, componentData) {
		if (error) {
			lintErrorsObj[absolutePath] = [error.message];
			return cb();
		}

		// Inject lookup paths into data
		componentData.lookupPaths = lookupPaths;

		// Begin the linting tests
		async.series([
			function (callback) {
				// Lint local deps and paths
				checkLocalPaths(absolutePath, componentData, function (error, lintErrors, resolvedDeps) {
					resolvedDepPaths = resolvedDeps;
					return callback(null, lintErrors);
				});
			}
		], function (error, lintErrors) {
			lintErrorsObj[absolutePath] = helpers.flattenArray(lintErrors);

			// If not recursive return results
			if (!recursive) {
				return cb();
			}

			// Otherwise recurse before returning the result
			async.forEach(resolvedDepPaths, function (depPath, callback) {
				exports.lintPath(depPath, lookupPaths, recursive, lintErrorsObj, callback);
			}, cb);
		});
	});
};