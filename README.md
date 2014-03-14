Component Hint
==============
Component Hint is a component linting tool. The main goal is to detect nuisances prior to
publication and alleviate debugging time (i.e. missing paths for local dependencies).

Features
--------
* Ensures a given components contains a `component.json` file
* Checks local dependencies exist within the given set of paths
* Checks local dependencies do not exist in more than 1 of the given paths
* In the event a local dependency isn't resolved, it will give you a hint as to where you can find
  it (uses the given `--lookupPaths` options)
* Skips folders with the same name as a dependency if it does not contain a `component.json` file

To Do
-----
* Detect unused paths in the `component.json` file
* Parse scripts for usages of `require()` and ensure those components exist in the `component.json`
* Check that the name inside the `component.json` file is the name used for the folder
* Check that any files listed in the `component.json` file (i.e. scripts, styles, etc.) actually exist

Installation
------------
```
	npm install component-hint
```

Usage
-----
```
Usage: component-hint [options] component_path [...]

Options:
  --recursive          Whether or not we should recurse and lint dependencies

  --lookupPaths=paths  Colon separated list of paths to check for the existance of
                       missing dependencies. This is used to give the user a hint
                       where they can find dependencies.
```

License
-------
Component Hint is distributed under the `MIT` License.