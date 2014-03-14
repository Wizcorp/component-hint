var fs = require('fs');
var path = require('path');
var async = require('async');

var componentHint = require('./component-hint.js');


/**
 * 
 * @param {type} errorMessage
 * @returns {undefined}
 */
exports.help = function (errorMessage) {
	console.error('Error:', errorMessage);
	console.log('Usage: component-hint [options] checkPaths');
};


/**
 * NOTE: There is a module I can use here, will embed it after I have open sourced it.
 * 
 * @param {type} args
 * @returns {undefined}
 */
function parseArgs(args) {
	var argObject = {
		'arguments': []
	};

	for (var argI = 0; argI < args.length; argI += 1) {
		var argStr = args[argI];

		//
		if (argStr[0] !== '-') {
			argObject['arguments'].push(argStr);
			continue;
		}

		//
		var argPieces = argStr.replace(/^[-]*/, '').split('=');
		argObject[argPieces[0]] = argObject[argPieces[0]] || [];

		if (argPieces[1] !== undefined) {
			argObject[argPieces[0]].push(argPieces[1]);
		}
	}

	return argObject;
}


/**
 * 
 * @param {type} pathsList
 * @param {type} cb
 * @returns {undefined}
 */
function ensurePathsExist(pathsList, cb) {
	async.forEach(pathsList, function (pathItem, callback) {
		var absolutePath = path.resolve(pathItem);
		fs.stat(absolutePath, function (error, stats) {
			if (error) {
				return callback(new Error('Path does not exist: ' + absolutePath));
			}

			if (!stats.isDirectory()) {
				return callback(new Error('Path is not a directory: ' + absolutePath));
			}

			return callback();
		});
	}, cb);
}


/**
 * 
 * @param {type} args
 * @param {type} cb
 * @returns {undefined}
 */
exports.execute = function (args, cb) {
	var argsObj = parseArgs(args);

	// Extract relavent arguments
	var checkPaths = argsObj['arguments'];
	var recursive = !!argsObj['recursive'];

	var lookupPathsArg = argsObj['lookupPaths'] || [];
	var lookupPaths = [];

	for (var i = 0; i < lookupPathsArg.length; i += 1) {
		var splitPaths = lookupPathsArg[i].split(':');
	
		for (var j = 0; j < splitPaths.length; j += 1) {
			var pathItem = splitPaths[j];

			if (!pathItem) {
				continue;
			}

			lookupPaths.push(pathItem);
		}
	}

	// Make sure we have some paths to check
	if (checkPaths.length === 0) {
		return cb(new Error('You must provide a path to be checked'));
	}

	// Ensure given paths exist
	async.series([
		function (callback) {
			// Make sure all the check paths exist
			ensurePathsExist(checkPaths, callback);
		},
		function (callback) {
			// Make sure all the lookup paths exist
			ensurePathsExist(lookupPaths, callback);
		}
	], function (error) {
		if (error) {
			return cb(error);
		}

		// Start the linting engine
		var lintErrorsObj = {};

		async.forEachSeries(checkPaths, function (checkPath, callback) {
			componentHint.lintPath(checkPath, lookupPaths, recursive, lintErrorsObj, callback);
		}, function () {
			if (Object.keys(lintErrorsObj).length) {
				// Pretty print the errors together
				for (var componentPath in lintErrorsObj) {
					var fileErrors = lintErrorsObj[componentPath];
					if (!fileErrors.length) {
						continue;
					}
					
					console.log(componentPath);
					fileErrors.forEach(function (errorText) {
						console.log(errorText);
					});
					console.log('');
				}
			}

			return cb(null, Object.keys(lintErrorsObj).length);
		});
	});
};