/**
 * Default reporter for component-hint. This will batch up all messages emitted and print the
 * results when all tests are complete.
 * 
 * @param {Object} componentHint
 * @returns {undefined}
 */
module.exports = function (componentHint) {
	var lintMessagesObj = {};

	// Catch all error messages and store them to messages object
	componentHint.on('lint.error', function (componentPath, errorMessage) {
		lintMessagesObj[componentPath] = lintMessagesObj[componentPath] || {};
		lintMessagesObj[componentPath].error = lintMessagesObj[componentPath].error || [];
		lintMessagesObj[componentPath].error.push(errorMessage);
	});

	// Catch all warning messages and store them to messages object
	componentHint.on('lint.warning', function (componentPath, warningMessage) {
		lintMessagesObj[componentPath] = lintMessagesObj[componentPath] || {};
		lintMessagesObj[componentPath].warning = lintMessagesObj[componentPath].warning || [];
		lintMessagesObj[componentPath].warning.push(warningMessage);
	});

	// Once all tests are complete, pretty print the results
	componentHint.on('postStageTests.complete', function () {
		for (var componentPath in lintMessagesObj) {
			if (!lintMessagesObj.hasOwnProperty(componentPath)) {
				continue;
			}

			var fileWarnings = lintMessagesObj[componentPath].warning || [];
			var fileErrors = lintMessagesObj[componentPath].error || [];
			if (!fileErrors.length && !fileWarnings.length) {
				continue;
			}

			console.log('');
			console.log(componentPath);

			for (var warningI = 0; warningI < fileWarnings.length; warningI += 1) {
				console.log('[warning]', fileWarnings[warningI].replace(/\n/g, '\n  '));
			}

			for (var errorI = 0; errorI < fileErrors.length; errorI += 1) {
				console.log('[error]', fileErrors[errorI].replace(/\n/g, '\n  '));
			}
		}
	});
};