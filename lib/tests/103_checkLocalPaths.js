var fs = require('fs');
var path = require('path');
var async = require('async');


/**
 * Name of this test file
 * @type String
 */
exports.name = 'check local dependencies and paths';


/**
 * Function which filters out all invalid paths specified in a component. The remaining valid paths
 * will be returned via the provided callback.
 * 
 * @param {Object} componentData
 * @param {Object} componentHint
 * @param {Function} cb
 * @returns {undefined}
 */
function getValidPaths(componentData, componentHint, cb) {
	var componentPath = componentData.path;
	var eventChannel = componentData.channel;

	var pathsList = componentData.json.paths || [];
	var validPaths = [];

	async.eachSeries(pathsList, function (pathItem, callback) {
		var checkPath = path.resolve(componentPath, pathItem);
		fs.stat(checkPath, function (error, stats) {
			// Make sure the path exists
			if (error) {
				componentHint.emit(eventChannel, componentPath, 'Path does not exist: ' + pathItem);
				return callback();
			}

			// Make sure the path is a directory
			if (!stats.isDirectory()) {
				componentHint.emit(eventChannel, componentPath, 'Path is not a directory: ' + pathItem);
				return callback();
			}

			// Otherwise push as valid path
			validPaths.push(pathItem);
			return callback();
		});
	}, function () {
		return cb(validPaths);
	});
}


/**
 * Function which resolves the path to a local dependency from a list of lookup paths.
 * 
 * @param {String} dependency
 * @param {String} componentPath
 * @param {Array} componentPaths
 * @param {Function} cb
 * @returns {undefined}
 */
function resolveDependencyPaths(dependency, componentPath, componentPaths, cb) {
	var resolvedPaths = [];

	async.eachSeries(componentPaths, function (lookupPath, callback) {
		var depPath = path.resolve(componentPath, lookupPath, dependency);
		var checkPath = path.join(depPath, 'component.json');

		fs.exists(checkPath, function (exists) {
			if (exists) {
				resolvedPaths.push(depPath);
			}

			return callback();
		});
	}, function () {
		return cb(resolvedPaths);
	});
}


/**
 * This test will run on the fly and will:
 *  - Check paths to ensure they are valid
 *  - Resolves dependency paths
 *  - Checks that the dependency doesnt exist in more than one path
 *  - Checks that there aren't any unused paths
 * 
 * @param {Object} componentData
 * @param {Object} componentHint
 * @param {Function} cb
 * @returns {undefined}
 */
exports.onTheFlyTest = function (componentData, componentHint, cb) {
	var componentPath = componentData.path;
	var eventChannel = componentData.channel;

	var lookupPaths = componentHint.lookupPaths || [];
	var localDeps = componentData.json.local || [];
	var resolvedDeps = [];


	// Check paths for existence and filter out the invalid ones
	getValidPaths(componentData, componentHint, function (validPaths) {
		var unusedPaths = validPaths.slice(0);

		async.eachSeries(localDeps, function (depName, callback) {
			resolveDependencyPaths(depName, componentPath, validPaths, function (resolvedPaths) {
				// Remove all resolved paths from the unused paths array
				for (var i = 0; i < resolvedPaths.length; i += 1) {
					var usedPathI = unusedPaths.indexOf(resolvedPaths[i]);
					if (usedPathI >= 0) {
						unusedPaths.splice(usedPathI, 1);
					}
				}

				// Check that dependency exists in a path
				if (resolvedPaths.length === 0) {
					var notFoundError = ['Could not find dep "' + depName + '" in any of the given paths'];

					// Check lookup paths to give the user a hint
					resolveDependencyPaths(depName, null, lookupPaths, function (hintPaths) {
						for (var hintI = 0; hintI < hintPaths.length; hintI += 1) {
							var hintPath = hintPaths[hintI];
							notFoundError.push('Found it in Lookup Path "' + path.relative(componentPath, hintPath) + '"');
						}

						componentHint.emit(eventChannel, componentPath, notFoundError.join('\n'));
						return callback();
					});

					return;
				}

				// Check that path doesnt exist in more than 1 path
				if (resolvedPaths.length > 1) {
					var tooManyError = ['Found dependency "' + depName + '" in more than one path:'];
					tooManyError.push.apply(tooManyError, resolvedPaths);

					componentHint.emit(eventChannel, componentPath, tooManyError.join('\n'));
					return callback();
				}

				// Add successfully resolved path to resolvedDeps list
				resolvedDeps.push(resolvedPaths[0]);

				return callback();
			});
		}, function () {
			// Check that there are no unused paths
			if (unusedPaths.length) {
				var unusedPathsError = ['Found unused component paths:'];
				unusedPathsError.push.apply(unusedPathsError, unusedPaths);
				componentHint.emit(eventChannel, componentPath, unusedPathsError.join('\n'));
			}

			return cb({localDeps: resolvedDeps});
		});
	});
};