var fs = require('fs');
var path = require('path');
var async = require('async');


/**
 * 
 * @param {type} componentPath
 * @param {type} componentData
 * @param {type} options
 * @param {type} cb
 * @returns {undefined}
 */
exports.test = function (componentPath, componentData, options, cb) {
	var lintErrors = [];

	var fileList = {
		scripts: componentData.ComponentJSON.scripts || ['./index.js'],
		styles: componentData.ComponentJSON.styles || [],
		json: componentData.ComponentJSON.json || [],
		images: componentData.ComponentJSON.images || [],
		fonts: componentData.ComponentJSON.fonts || [],
		files: componentData.ComponentJSON.files || [],
		templates: componentData.ComponentJSON.templates || []
	};

	async.each(Object.keys(fileList), function (fileType, fileTypeCb) {
		var files = fileList[fileType];

		async.each(files, function (fileName, callback) {
			var fullFileName = path.resolve(componentPath, fileName);

			fs.stat(fullFileName, function (error, stats) {
				if (error) {
					// Make sure the path exists
					lintErrors.push('"' + fileType + '" file does not exist: ' + fileName);
					return callback();
				}

				return callback();
			});
		}, fileTypeCb);
	}, function () {
		return cb(lintErrors);
	});
};