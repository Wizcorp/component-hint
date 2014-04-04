var fs = require('fs');
var path = require('path');
var async = require('async');

var helpers = require('../helpers.js');


/**
 * Object holding all dependencies and their versions
 * @type type
 */
var dependencyVersions = {};


/**
 * 
 * @param {type} depName
 * @param {type} depPaths
 * @param {type} cb
 * @returns {undefined}
 */
function resolveDependencyPath(depName, depPaths, cb) {
	var resolvedPaths = [];
	var errors = [];

	async.eachSeries(depPaths, function (depPath, callback) {
		var normalizedName = helpers.normalizeComponentName(depName);
		var resolvedPath = path.resolve(depPath, normalizedName);

		fs.exists(resolvedPath, function (exists) {
			if (exists) {
				resolvedPaths.push(resolvedPath);
			}

			return callback();
		});
	}, function () {
		if (resolvedPaths.length === 0) {
			errors.push('Could not find dependency "' + depName + '" in any of the dependency paths');
			return cb(errors);
		}

		if (resolvedPaths.length > 1) {
			errors.push('Found dependency "' + depName + '" in more than one of the dependency paths');
			for (var i = 0; i < resolvedPaths.length; i += 1) {
				errors.push(resolvedPaths[i]);
			}

			return cb(errors);
		}

		return cb(null, resolvedPaths[0]);
	});
}


/**
 * 
 * @param {type} componentPath
 * @param {type} componentData
 * @param {type} cb
 * @returns {undefined}
 */
exports.test = function (componentPath, componentData, cb) {
	var dependencies = componentData.ComponentJSON.dependencies || {};
	var depPaths = componentData.depPaths;
	var resolvedDeps = [];
	var lintErrors = [];

	async.series([
		function (callback) {
			// Skip if not recursive
			if (!componentData.recursive) {
				return callback();
			}

			// Otherwise resolve dependency paths for recursion
			async.eachSeries(Object.keys(dependencies), function (depName, depCb) {
				resolveDependencyPath(depName, depPaths, function (errors, resolvedPath) {
					if (lintErrors) {
						lintErrors.push.apply(lintErrors, errors);
					}

					if (resolvedPath) {
						resolvedDeps.push(resolvedPath);
					}

					return depCb();
				});
			}, callback);
		},
		function (callback) {
			// Check that there aren't more than a single version of the same dependency
			for (var depName in dependencies) {
				var depVersion = dependencies[depName];

				dependencyVersions[depName] = dependencyVersions[depName] || {};
				var depObj = dependencyVersions[depName];

				depObj[depVersion] = depObj[depVersion] || [];
				depObj[depVersion].push(componentPath);

				if (Object.keys(depObj).length > 1) {
					lintErrors.push('Dependency "' + depName + '" exists @ multiple versions:');
					for (var version in depObj) {
						var versionObj = depObj[version];
						lintErrors.push(' - @' + version + ': ' + versionObj.length + ' instance(s)');
					}
				}
			}

			return callback();
		}
	], function () {
		return cb(null, lintErrors, resolvedDeps);
	});
};