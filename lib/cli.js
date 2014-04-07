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
	console.log('');
	console.log('Usage: component-hint [options] component_path [...]');
	console.log('');
	console.log('Options:');
	console.log('  --recursive          Whether or not we should recurse and lint dependencies\t');
	console.log('');
	console.log('  --depPaths=paths     Colon separated list of paths to dependency components. These');
	console.log('                       paths will be used to recurse into installed components.');
	console.log('');
	console.log('  --warn-on-deps       If provided, 3rd party (dependencies) component errors will');
	console.log('                       only result in a warning and not return a fail status code.');
	console.log('');
	console.log('  --lookupPaths=paths  Colon separated list of paths to check for the existance of');
	console.log('                       missing dependencies. This is used to give the user a hint');
	console.log('                       where they can find dependencies.');
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


function pathsArgToPathArray(pathsArg) {
	var pathsArray = [];

	for (var i = 0; i < pathsArg.length; i += 1) {
		var splitPaths = pathsArg[i].split(':');
	
		for (var j = 0; j < splitPaths.length; j += 1) {
			var pathItem = splitPaths[j];

			if (!pathItem) {
				continue;
			}

			pathsArray.push(pathItem);
		}
	}

	return pathsArray;
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
	var checkPaths = argsObj.arguments;
	var recursive = !!argsObj.recursive;
	var warnOnDeps = !!argsObj['warn-on-deps'];

	var depPaths = pathsArgToPathArray(argsObj.depPaths || []);
	var lookupPaths = pathsArgToPathArray(argsObj.lookupPaths || []);

	// Make sure we have some paths to check
	if (checkPaths.length === 0) {
		return cb(new Error('You must provide a path to be checked'));
	}

	// Inject default dep path if recursive
	if (!depPaths.length && fs.existsSync('./components')) {
		depPaths.push('./components');
	}

	// Make sure all given paths exist
	ensurePathsExist([].concat(checkPaths, depPaths, lookupPaths), function (error) {
		if (error) {
			return cb(error);
		}

		// Start the linting engine
		var lintErrorsObj = {};

		var lintOptions = {
			depPaths: depPaths,
			lookupPaths: lookupPaths,
			recursive: recursive,
			warnOnDeps: warnOnDeps
		};

		async.forEachSeries(checkPaths, function (checkPath, callback) {
			componentHint.lintPath(checkPath, lintOptions, lintErrorsObj, null, callback);
		}, function () {
			var totalWarnings = 0;
			var totalErrors = 0;

			if (Object.keys(lintErrorsObj).length) {
				// Pretty print the errors together
				for (var componentPath in lintErrorsObj) {
					var fileWarnings = lintErrorsObj[componentPath].warning || [];
					var fileErrors = lintErrorsObj[componentPath].error || [];
					if (!fileErrors.length && !fileWarnings.length) {
						continue;
					}

					console.log('');
					console.log(componentPath);

					for (var i = 0; i < fileWarnings.length; i += 1) {
						console.log('[warning]', fileWarnings[i]);
						totalWarnings += 1;
					}

					for (var i = 0; i < fileErrors.length; i += 1) {
						console.log('[error]', fileErrors[i]);
						totalErrors += 1;
					}
				}
			}

			return cb(null, totalErrors);
		});
	});
};