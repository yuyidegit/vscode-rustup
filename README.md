# vscode-rustup

A simple status bar item to show the current rustup channel, and a command for setting the override. Will periodically remind when `rustup update` reports any toolchain has an update ready. 

## Features

When a Rust file is open, a status bar item showing the current rustup toolchain will display on the left. Click it, and you will be able to select an argument that will be used with `rustup override set`.

## Requirements

Needs rustup to be installed & in the PATH.

## Extension Settings

No settings, but in the future the update check should be optional.

## Known Issues

If rustup isn't installed, may complain and throw errors.

Errors during updating are ignored and not logged anywhere.

## Release Notes

### 1.0.0

Initial release with barebones featureset.
