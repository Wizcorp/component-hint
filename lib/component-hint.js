var fs = require('fs');
var path = require('path');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;


/**
 * Load tests from tests folder. These will be ordered by filename so patterns such as 01_someTest
 * can be used to influence order of test execution. Further to this tests are broken up into 2
 * stages. The onTheFly stage will perform tests right after it loads the data for a single
 * component, whilst the postStage stage will perform its tests after all relevant data has been
 * loaded.
 * 
 * Further to this any file starting with '.' character will be ignored.
 */
var testsFolder = path.join(__dirname, './tests');
var testFiles = fs.readdirSync(testsFolder);

var onTheFlyTests = {};
var postStageTests = {};

for (var testI = 0; testI < testFiles.length; testI += 1) {
	var testFile = testFiles[testI];
	if (testFile[0] === '.' || path.extname(testFile) !== '.js') {
		continue;
	}

	var testModule = require(path.join(testsFolder, testFile));

	// Push in onTheFlyTest if it exists
	if (testModule.onTheFlyTest) {
		onTheFlyTests[testFile] = testModule.onTheFlyTest;
	}

	// Push in postStageTest if it exists
	if (testModule.postStageTest) {
		postStageTests[testFile] = testModule.postStageTest;
	}
}


/**
 * Component Hint event emitter object.
 * 
 * @param {Object} options
 * @returns {ComponentHint}
 */
function ComponentHint(options) {
	// Make this an event emitter
	EventEmitter.call(this);

	// List of all components that have been checked, we keep this list so that the same components
	// are not checked twice.
	this.lintedComponents = [];

	// Object holding all external dependencies and their versions
	this.dependencyVersions = {};

	// Set linting options from given options or defaults
	this.depPaths = options.depPaths || [];
	this.lookupPaths = options.lookupPaths || [];
	this.recursive = options.recursive || false;
	this.warnOnDeps = options.warnOnDeps || false;

	// Inject default dep path if recursive
	if (this.recursive && !this.depPaths.length && fs.existsSync('./components')) {
		this.depPaths.push('./components');
	}

	// Keep a count of total errors and warnings
	this.totalErrors = 0;
	this.on('lint.error', function () {
		this.totalErrors += 1;
	});

	this.totalWarnings = 0;
	this.on('lint.warning', function () {
		this.totalErrors += 1;
	});
}

// Inherit event emitter onto ComponentHint object
inherits(ComponentHint, EventEmitter);


/**
 * Function which loads component data for given component path
 * 
 * @param {String} componentPath
 * @param {Boolean} isExternalDep
 * @param {Function} cb
 * @returns {undefined}
 */
ComponentHint.prototype.loadComponentData = function (componentPath, isExternalDep, cb) {
	var self = this;
	var componentJson;

	// Check if this components is an external dependency and warn-on-deps options was provided.
	// If so set appropriate eventChannel.
	var eventChannel = 'lint.error';
	if (isExternalDep && this.warnOnDeps) {
		eventChannel = 'lint.warning';
	}

	async.series([
		function (callback) {
			// Try and load the component.json file
			var jsonFilename = path.join(componentPath, 'component.json');
			fs.exists(jsonFilename, function (exists) {
				if (!exists) {
					var error = new Error('Component JSON file does not exist: ' + jsonFilename);
					self.emit(eventChannel, componentPath, error.message);
					return callback(error);
				}

				componentJson = require(jsonFilename);
				return callback();
			});
		}
	], function (error) {
		if (error) {
			return cb(error);
		}

		return cb(null, {
			'path': componentPath,
			'json': componentJson,
			'channel': eventChannel
		});
	});
};


/**
 * Function which loads several component paths, and checks them sequentially.
 * 
 * @param {Array} checkPaths
 * @param {Object} extras
 * @param {Function} cb
 * @returns {undefined}
 */
ComponentHint.prototype.loadPaths = function (checkPaths, extras, cb) {
	var self = this;
	async.eachSeries(checkPaths, function (checkPath, callback) {
		self.onTheFlyChecks(checkPath, extras, callback);
	}, cb);
};


/**
 * Function which loads all relevant data for a single component path, and performs checks on the
 * fly.
 * 
 * @param {String} checkPath
 * @param {Boolean} isExternalDep
 * @param {Function} cb
 * @returns {unresolved}
 */
ComponentHint.prototype.onTheFlyChecks = function (checkPath, isExternalDep, cb) {
	var self = this;

	var absolutePath = path.resolve(checkPath);
	var resolvedLocalDeps = [];
	var resolvedExternalDeps = [];

	// Check if this component has already been linted
	if (this.lintedComponents.indexOf(absolutePath) >= 0) {
		return cb();
	}

	// Mark this path as checked
	this.lintedComponents.push(absolutePath);

	// Load all relevent data
	this.loadComponentData(absolutePath, isExternalDep, function (error, componentData) {
		if (error) {
			// We don't have to return the error here as it was already emited as a lint error. This
			// is more so used to let us know if we should continue with linting tests for this
			// component.
			return cb();
		}

		// Begin onTheFly tests
		async.eachSeries(Object.keys(onTheFlyTests).sort(), function (testName, callback) {
			var onTheFlyTest = onTheFlyTests[testName];

			onTheFlyTest(componentData, self, function (resolvedDeps) {
				// Add any resolved local deps to local deps list
				if (resolvedDeps && resolvedDeps.localDeps) {
					resolvedLocalDeps.push.apply(resolvedLocalDeps, resolvedDeps.localDeps || []);
				}

				// Add any resolved external deps to external deps list
				if (resolvedDeps && resolvedDeps.externalDeps) {
					resolvedExternalDeps.push.apply(resolvedExternalDeps, resolvedDeps.externalDeps || []);
				}

				return callback();
			});
		}, function () {
			// Callback if not recursive
			if (!self.recursive) {
				return cb();
			}

			// Recurse into local deps first
			async.eachSeries(resolvedLocalDeps, function (depPath, callback) {
				self.onTheFlyChecks(depPath, isExternalDep, callback);
			}, function () {
				// Mark these and their deps as external deps from here on
				var isExternalDep = true;

				// Now recurse into external deps
				async.eachSeries(resolvedExternalDeps, function (depPath, callback) {
					self.onTheFlyChecks(depPath, isExternalDep, callback);
				}, cb);
			});
		});
	});
};


/**
 * Function which executes all post stage tests.
 * 
 * @param {Function} cb
 * @returns {undefined}
 */
ComponentHint.prototype.postChecks = function (cb) {
	var self = this;

	// Emit event showing postStage tests have started
	this.emit('postStageTests.started');

	// Execute postStage tests
	async.eachSeries(Object.keys(postStageTests).sort(), function (testName, callback) {
		var postStageTest = postStageTests[testName];
		postStageTest(self, function () {
			self.emit('postStageTests.progress', testName);
			return callback();
		});
	}, function () {
		// Emit event singifying postStage tests completion
		self.emit('postStageTests.complete');
		return cb();
	});
};


// Export ComponentHint class
module.exports = ComponentHint;