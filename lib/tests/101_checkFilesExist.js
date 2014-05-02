var fs = require('fs');
var path = require('path');
var async = require('async');


/**
 * Name of this test file
 * @type String
 */
exports.name = 'check files exist';


/**
 * This test will run on the fly and checks each file type within the component.json file for it's
 * existance.
 * 
 * @param {Object} componentData
 * @param {Object} componentHint
 * @param {Function} cb
 * @returns {undefined}
 */
exports.onTheFlyTest = function (componentData, componentHint, cb) {
	var componentPath = componentData.path;
	var eventChannel = componentData.channel;

	var fileList = {
		scripts: componentData.json.scripts || [],
		styles: componentData.json.styles || [],
		json: componentData.json.json || [],
		images: componentData.json.images || [],
		fonts: componentData.json.fonts || [],
		files: componentData.json.files || [],
		templates: componentData.json.templates || []
	};

	async.eachLimit(Object.keys(fileList), 5, function (fileType, fileTypeCb) {
		var files = fileList[fileType];

		async.eachLimit(files, 10, function (fileName, callback) {
			var fullFileName = path.resolve(componentPath, fileName);

			fs.exists(fullFileName, function (exists) {
				if (!exists) {
					// Path does not exist
					componentHint.emit(eventChannel, componentPath, '"' + fileType + '" file does not exist: ' + fileName);
				}

				return callback();
			});
		}, fileTypeCb);
	}, cb);
};