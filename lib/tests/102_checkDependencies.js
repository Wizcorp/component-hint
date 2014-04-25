var fs = require('fs');
var path = require('path');
var async = require('async');

var helpers = require('../helpers.js');


/**
 * Name of this test file
 * @type String
 */
exports.name = 'check external dependencies';


/**
 * Function which resolves the path to an external dependency from a list of lookup paths.
 * 
 * @param {String} depName
 * @param {Array} depPaths
 * @param {Function} cb
 * @returns {undefined}
 */
function resolveDependencyPaths(depName, depPaths, cb) {
	var normalizedName = helpers.normalizeComponentName(depName);
	var resolvedPaths = [];

	async.eachSeries(depPaths, function (depPath, callback) {
		var resolvedPath = path.resolve(depPath, normalizedName);

		fs.exists(resolvedPath, function (exists) {
			if (exists) {
				resolvedPaths.push(resolvedPath);
			}

			return callback();
		});
	}, function () {
		return cb(resolvedPaths);
	});
}


/**
 * This test will run on the fly and will:
 *  - Resolves dependency paths
 *  - Checks that the dependency doesnt exist in more than one path
 *  - Checks that the dependency does not have itself as a dependency
 *  - Load dependency version for post processing
 * 
 * @param {Object} componentData
 * @param {Object} componentHint
 * @param {Function} cb
 * @returns {undefined}
 */
exports.onTheFlyTest = function (componentData, componentHint, cb) {
	var componentPath = componentData.path;
	var eventChannel = componentData.channel;

	var dependencyVersions = componentHint.dependencyVersions;
	var dependencies = componentData.json.dependencies || {};
	var depPaths = componentHint.depPaths;

	var resolvedDeps = [];


	// Otherwise resolve dependency paths for recursion
	async.eachSeries(Object.keys(dependencies), function (depName, callback) {
		resolveDependencyPaths(depName, depPaths, function (resolvedPaths) {
			// Check if any paths resolved
			if (resolvedPaths.length === 0) {
				componentHint.emit(eventChannel, componentPath, 'Could not find dependency "' + depName + '" in any of the dependency paths');
				return callback();
			}

			// Check if more than a single path resolved
			if (resolvedPaths.length > 1) {
				var tooManyError = ['Found dependency "' + depName + '" in more than one of the dependency paths'];
				for (var i = 0; i < resolvedPaths.length; i += 1) {
					tooManyError.push(resolvedPaths[i]);
				}

				componentHint.emit(eventChannel, componentPath, tooManyError.join('\n'));
				return callback();
			}

			// Extract single path from array
			var resolvedPath = resolvedPaths[0];

			// Check if this component is requiring itself
			if (resolvedPath === componentPath) {
				componentHint.emit(eventChannel, componentPath, '"' + depName + '" contains itself as a dependency');
				return callback();
			}

			// Add successfully resolved path to resolvedDeps list
			resolvedDeps.push(resolvedPath);

			// Add resolved dependency to versions list for later processing
			dependencyVersions[resolvedPath] = dependencyVersions[resolvedPath] || {};
			var depObj = dependencyVersions[resolvedPath];
			var depVersion = dependencies[depName];

			depObj[depVersion] = depObj[depVersion] || [];
			depObj[depVersion].push(componentPath);

			return callback();
		});
	}, function () {
		return cb({externalDeps: resolvedDeps});
	});
};