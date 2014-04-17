var fs = require('fs');
var path = require('path');
var async = require('async');
var cliOptions = require('commander');

var packageJson = require('../package.json');
var componentHint = require('./component-hint.js');


/**
 * Function which re-formats commander option descriptions to have correct new lines and padding.
 * This makes the output a whole lot cleaner with long description strings, and takes terminal
 * window width into consideration.
 * 
 * @param {Array} options - options array from commander object
 * @param {Integer} width - maximum width for output, this should include padding size
 * @returns {undefined}
 */
function formatOptionStrings (options, width) {
	var totalWidth = (width < process.stdout.columns) ? width : process.stdout.columns;
	var paddingWidth = cliOptions.largestOptionLength() + 6;
	var stringWidth = totalWidth - paddingWidth;

	var paddingString = '\n' + Array(paddingWidth - 3).join(' ');

	for (var i = 0; i < options.length; i++) {
		var option = options[i];

		// Separate description by width taking words into consideration
		var description = option.description;
		var splitDescription = [];
		while (description) {
			if (description.length <= stringWidth) {
				splitDescription.push(description);
				description = '';
				continue;
			}

			var lastSpaceI = description.lastIndexOf(' ', stringWidth);
			var stringChunk = description.substring(0, lastSpaceI);
			description = description.substring(lastSpaceI + 1);
			splitDescription.push(stringChunk);
		}

		// Reconstruct description with correct padding
		option.description = splitDescription.join(paddingString);
	}
}


/**
 * Function which sets up the commander object with all of our options and customisations.
 * 
 * @returns {undefined}
 */
function setupCliObject () {
	// Set cli options
	cliOptions
		.version(packageJson.version)
		.usage('[options] <component_path ...>')
		.option('-r, --recursive',
			'Whether or not we should recurse and lint dependencies.')
		.option('-d, --dep-paths <paths>',
			'Colon separated list of paths to dependency components. These paths will be used to ' +
			'recurse into installed components.')
		.option('-w, --warn-on-deps',
			'If provided, 3rd party (dependencies) component errors will only result in a warning ' +
			'and not return a fail status code.')
		.option('-l, --lookup-paths <paths>',
			'Colon separated list of paths to check for the existance of missing dependencies. This ' +
			'is used to give the user a hint where they can find dependencies.');

	// Cleanup option strings and re-format them
	formatOptionStrings(cliOptions.options, 100);

	// Add additional info at the bottom of our help
	cliOptions.on('--help', function() {
		var scriptName = path.basename(process.argv[1]);

		console.log('  Examples:');
		console.log('');
		console.log('    Check multiple component entry points');
		console.log('    $ ' + scriptName + ' /path/to/single/component /path/to/another/component');
		console.log('');
		console.log('    Check multiple component entry point which exist in the same folder');
		console.log('    $ ' + scriptName + ' /path/to/multiple/component/folder/*/');
		console.log('');
	});

	// Parse arguments
	cliOptions.parse(process.argv);
}


/**
 * Function which esures all given paths exist. If not it will return an error via the callback
 * provided.
 * 
 * @param {Array} pathsList
 * @param {Function} cb
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
 * Function which outputs errors message followed by help.
 * 
 * @param {String} errorMessage
 * @returns {undefined}
 */
exports.errorHelp = function (errorMessage) {
	console.log('  Error: ' + errorMessage);
	cliOptions.outputHelp();
};


/**
 * 
 * @param {Function} cb
 * @returns {undefined}
 */
exports.execute = function (cb) {
	// Setup commander object and parse arguments
	setupCliObject();

	// Extract relavent arguments
	var checkPaths = cliOptions.args;
	var recursive = !!cliOptions.recursive;
	var warnOnDeps = !!cliOptions.warnOnDeps;

	// TODO: when issue #27 is addressed the below split(':') needs to be changed to
	// split(path.delimiter). This ensure this tool is compatiple with windows as well.
	var depPaths = (cliOptions.depPaths) ? cliOptions.depPaths.split(':') : [];
	var lookupPaths = (cliOptions.lookupPaths) ? cliOptions.lookupPaths.split(':') : [];

	// Make sure we have some paths to check
	if (checkPaths.length === 0) {
		return cb(new Error('You must provide a path to be checked'));
	}

	// Inject default dep path if recursive
	if (recursive && !depPaths.length && fs.existsSync('./components')) {
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