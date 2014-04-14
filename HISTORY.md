Release history
===============

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