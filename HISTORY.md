Release history
===============

v0.4.2
------

* Fixed bug where CLI would go into infinite loop if console screen size was too small for output
  formatting.

v0.4.1
------

* Fixed bug where used paths were not being registered
* Fixed Fixed Bug where index.js file was being assumed, even though not in component.json file

v0.4.0
------

* Implemented commander as CLI argument parser
* Re-factored flow and made component-hint an event emitter object. This allowed us to make for much
  more natural data passing.
* Introduced reporters for the formatting of CLI output.
* Split tests up into 2 separate stages, onTheFly and postStage and refactored all existing tests to
  match new architecture.
* Introduced verbose option to show progress as tests are completed. Also added final report showing
  total errors and warnings or success message.
* Introduced quiet and silent options.
* Implemented ignore argument with minimatch globbing.
* Implemented check which checks that any file listed in component.json (scripts, files, styles etc)
  actually exist.
* Integrated JSHint into the project
* Fixed all JSHint error found
* Other minor bug fixes and touch-ups


v0.3.0
------

* Implemented dependency checking. This includes the checking of their existence in the provided
  `--depPaths` as well as checking that only a single version of any dependency is required in a
  given project. Also to aid status code management a `--warn-on-deps` argument was introduced which
  will switch the dependency errors to a warning level. And thus not affecting the exit status code.
* Implemented self reference dependency check.

v0.2.0
------

* Implemented unused path check within local path test
* Modified nodejs engine version to be anything 0.8 and above, 0.8.24 was too restrictive, and we
  could go lower than 0.8, however we decided to start there and move down if there is a request.

v0.1.0
------

* Fixed exit code
* Moved version to 0.1.0 as 0.0.x is bad practice


v0.0.1
------

Initial release to npm, with initial feature set