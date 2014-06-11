var fs = require('fs');
var path = require('path');
var async = require('async');
var cliOptions = require('commander');

var packageJson = require('../package.json');
var ComponentHint = require('./component-hint.js');


/**
 * Function which re-formats commander option descriptions to have correct new lines and padding.
 * This makes the output a whole lot cleaner with long description strings, and takes terminal
 * window width into consideration.
 * 
 * @param {Array} options - options array from commander object
 * @param {Integer} width - maximum width for output, this should include padding size
 * @returns {undefined}
 */
function formatOptionStrings(options, width) {
	var totalWidth = (width < process.stdout.columns) ? width : process.stdout.columns;
	var paddingWidth = cliOptions.largestOptionLength() + 6;
	var stringWidth = totalWidth - paddingWidth;
	if (stringWidth <= 0) {
		return;
	}

	var paddingString = '\n' + (new Array(paddingWidth - 3)).join(' ');

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
			if (lastSpaceI < 0) {
				splitDescription.push(description);
				description = "";
				break;
			}

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
function setupCliObject() {
	// Set cli options
	cliOptions
		.version(packageJson.version)
		.usage('[options] <component_path ...>')
		.option('-v, --verbose',
			'Be verbose about the tests. (cannot be used with --quiet or --silent)')
		.option('-q, --quiet',
			'Display only the final outcome.')
		.option('-s, --silent',
			'Suppress all output.')
		.option('-r, --recursive',
			'Recurse into local and external dependencies.')
		.option('-d, --dep-paths <paths>',
			'Colon separated list of paths to external dependencies. (default: "./components")')
		.option('-w, --warn-on-deps',
			'Errors caused by external dependencies will only result in a warning and not return ' +
			'a fail status code.')
		.option('-i, --ignore-paths <paths>',
			'List of paths component-hint should ignore. These can be absolute, relative or regexes.')
		.option('-l, --lookup-paths <paths>',
			'Colon separated list of paths to check for the existence of missing local ' +
			'dependencies. This is used to give the user a hint where they can find them.')
		.option('    --reporter <path>',
			'Path to reporter file to use for output formatting.',
			path.join(__dirname, './reporters/default.js'));

	// Cleanup option strings and re-format them
	formatOptionStrings(cliOptions.options, 100);

	// Add additional info at the bottom of our help
	cliOptions.on('--help', function () {
		var scriptName = path.basename(process.argv[1]);

		process.stdout.write('  Examples:\n');
		process.stdout.write('\n');
		process.stdout.write('    Check multiple component entry points\n');
		process.stdout.write('    $ ' + scriptName + ' /path/to/single/component /path/to/another/component\n');
		process.stdout.write('\n');
		process.stdout.write('    Check multiple component entry point which exist in the same folder\n');
		process.stdout.write('    $ ' + scriptName + ' /path/to/multiple/component/folder/*/\n');
		process.stdout.write('\n');
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
	async.eachLimit(pathsList, 10, function (pathItem, callback) {
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
	process.stdout.write('  Error: ' + errorMessage + '\n');
	cliOptions.outputHelp();
};


/**
 * Function which executes CLI on the current process argv
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
	var verbose = cliOptions.verbose;
	var quiet = cliOptions.quiet;
	var silent = cliOptions.silent;
	var warnOnDeps = !!cliOptions.warnOnDeps;
	var reporterPath = cliOptions.reporter;

	// TODO: when issue #27 is addressed the below split(':') needs to be changed to
	// split(path.delimiter). This ensure this tool is compatiple with windows as well.
	var depPaths = (cliOptions.depPaths) ? cliOptions.depPaths.split(':') : [];
	var lookupPaths = (cliOptions.lookupPaths) ? cliOptions.lookupPaths.split(':') : [];
	var ignorePaths = (cliOptions.ignorePaths) ? cliOptions.ignorePaths.split(':') : [];

	// Make sure we have some paths to check
	if (checkPaths.length === 0) {
		return cb(new Error('You must provide a path to be checked'));
	}

	// Make sure reporter exists
	if (!fs.existsSync(reporterPath)) {
		return cb(new Error('Given reporter script "' + reporterPath + '" does not exist'));
	}
	
	// Make sure verbose option is present at the same time as quiet or silent
	if (verbose && (quiet || silent)) {
		return cb(new Error('Verbose mode cannot be used at the same time as Quiet or Silent'));
	}

	// Make sure all given paths exist
	ensurePathsExist([].concat(checkPaths, depPaths, lookupPaths), function (error) {
		if (error) {
			return cb(error);
		}

		// Start the linting engine
		var componentHint = new ComponentHint({
			depPaths: depPaths,
			lookupPaths: lookupPaths,
			recursive: recursive,
			verbose: verbose,
			quiet: quiet,
			silent: silent,
			warnOnDeps: warnOnDeps,
			ignorePaths: ignorePaths
		});

		// Attach reporter to linting engine
		require(reporterPath)(componentHint);

		// Load component data and perform onTheFly tests
		componentHint.checkPaths(checkPaths, null, function () {
			// Now do postCheck tests after all data has been loaded
			componentHint.postChecks(function () {
				return cb(null, componentHint.totalErrors);
			});
		});
	});
};