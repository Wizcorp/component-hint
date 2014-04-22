

/**
 * Function which normalizes a component name
 * 
 * @param {String} componentName
 * @returns {String}
 */
exports.normalizeComponentName = function (componentName) {
	return componentName.replace(/\//, '-');
};