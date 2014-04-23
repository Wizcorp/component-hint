Component Hint
==============
Component Hint is a linting tool for [Component.io](https://github.com/component/component). The
main goal is to detect nuisances prior to publication and alleviate debugging time (e.g. missing
paths for local dependencies).

Features
--------
* Ensures a given components contains a `component.json` file
* Checks local dependencies exist within the given set of paths
* Detect any unused paths in the `component.json` file
* Checks local dependencies do not exist in more than 1 of the given paths
* In the event a local dependency isn't resolved, it will give you a hint as to where you can find
  it (uses the given `--lookupPaths` options)
* Skips folders with the same name as a dependency if it does not contain a `component.json` file
* Check dependencies exist in given list of paths
* Check dependencies are only required at a single version through the project
* Recurses into dependencies and checks if there are any other dependency errors
  (this can be switched to warning level by using --warn-on-deps argument)
* Checks that a component doesn't have itself as a dependency
* Check that any files listed in the `component.json` file (i.e. scripts, styles, etc.) actually
  exist

To Do
-----
* Parse scripts for usages of `require()` and ensure those components exist in the `component.json`
* Check that the name inside the `component.json` file is the name used for the folder
* [Other issues](https://github.com/Wizcorp/component-hint/issues)

Installation
------------
```
npm install component-hint
```

OR if installed globally component-hint can be accessed like any other component command
```
npm install -g component-hint
component hint
```

Usage
-----
```
  Usage: component-hint [options] <component_path ...>

  Options:

    -h, --help                  output usage information
    -V, --version               output the version number
    -v, --verbose               Whether or not we should be verbose with our output. (cannot be used
                                with --quiet or --silent options)
    -q, --quiet                 Using this option will result in only the final outcome being
                                displayed.
    -s, --silent                Whether or not we should show anything on screen at all.
    -r, --recursive             Whether or not we should recurse into local and external
                                dependencies.
    -d, --dep-paths <paths>     Colon separated list of paths to external dependencies. (default:
                                "./components")
    -w, --warn-on-deps          If provided, errors caused by external dependencies will only result
                                in a warning and not return a fail status code.
    -l, --lookup-paths <paths>  Colon separated list of paths to check for the existence of missing
                                local dependencies. This is used to give the user a hint where they
                                can find them.
        --reporter <path>       Path to reporter file to use for output formatting.

  Examples:

    Check multiple component entry points
    $ component-hint /path/to/single/component /path/to/another/component

    Check multiple component entry point which exist in the same folder
    $ component-hint /path/to/multiple/component/folder/*/
```

License
-------
Component Hint is distributed under the `MIT` License.