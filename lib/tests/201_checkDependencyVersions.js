var path = require('path');

/**
 * This test will run during the post stage and will check each external dependency version
 * requirement, ensuring no more than a single version of each dependency is required.
 * 
 * @param {Object} componentHint
 * @param {Function} cb
 * @returns {undefined}
 */
exports.postStageTest = function (componentHint, cb) {
	var dependencyVersions = componentHint.dependencyVersions;
	var eventChannel = (componentHint.warnOnDeps) ? 'lint.warning' : 'lint.error';

	for (var depPath in dependencyVersions) {
		if (!dependencyVersions.hasOwnProperty(depPath)) {
			continue;
		}

		var depObj = dependencyVersions[depPath];
		var depName = path.basename(depPath);

		if (Object.keys(depObj).length > 1) {
			var errorString = ['Dependency "' + depName + '" exists @ multiple versions:'];
			for (var version in depObj) {
				if (!depObj.hasOwnProperty(version)) {
					continue;
				}

				var versionObj = depObj[version];
				errorString.push('- @' + version + ': ' + versionObj.length + ' instance(s)');
			}

			componentHint.emit(eventChannel, depPath, errorString.join('\n'));
		}
	}

	return cb();
};