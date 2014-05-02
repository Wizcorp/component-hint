var path = require('path');


/**
 * Name of this test file
 * @type String
 */
exports.name = 'check external dependency versions';


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
			var errorString = ['Multiple versions of dependency "' + depName + '" are being required'];
			for (var version in depObj) {
				if (!depObj.hasOwnProperty(version)) {
					continue;
				}

				var versionObj = depObj[version];
				errorString.push('- ' + version + ': ' + versionObj.length + ' instance(s)');
				if (componentHint.verbose) {
					for (var filenameI = 0; filenameI < versionObj.length; filenameI += 1) {
						var filename = versionObj[filenameI];
						errorString.push('  ' + filename);
					}
				}
			}

			componentHint.emit(eventChannel, depPath, errorString.join('\n'));
		}
	}

	return cb();
};