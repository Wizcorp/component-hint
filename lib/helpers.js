var path = require('path');
var minimatch = require('minimatch');


/**
 * Function which normalizes a component name
 * 
 * @param {String} componentName
 * @returns {String}
 */
exports.normalizeComponentName = function (componentName) {
	return componentName.replace(/\//, '-');
};


/**
 * Checks whether a given file matches any pattern in a given list of filename patterns
 *
 * @param {String} absolutePath - a path to a file
 * @param {Array} pathPatterns - a list of filename patterns
 * @return {Boolean} True if given path matches a pattern in pathPatterns, False otherwise.
 */
exports.pathMatchPatterns = function (absolutePath, pathPatterns) {
	for (var i = 0; i < pathPatterns.length; i += 1) {
		var pathPattern = path.resolve(pathPatterns[i]);

		// Check if is a matching minimatch pattern
		if (minimatch(absolutePath, pathPattern)) {
			return true;
		}

		// Check if starts with pathPattern literal
		if (absolutePath.indexOf(pathPattern) === 0) {
			return true;
		}
	}

	return false;
};