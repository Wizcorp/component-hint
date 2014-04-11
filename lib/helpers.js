

/**
 * 
 * @param {Array} arr
 * @returns {Array}
 */
exports.flattenArray = function (arr) {
	var flatArray = [];

	for (var i = 0; i < arr.length; i += 1) {
		if (Array.isArray(arr[i])) {
			flatArray = flatArray.concat(exports.flattenArray(arr[i]));
		} else {
			if (!arr[i]) {
				continue;
			}

			flatArray.push(arr[i]);
		}
	}

	return flatArray;
};


/**
 * 
 * @param {String} componentName
 * @returns {String}
 */
exports.normalizeComponentName = function (componentName) {
	return componentName.replace(/\//, '-');
};