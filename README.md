# vscode-rustup

A simple status bar item to show the current rustup channel, and a command for setting the override. Will periodically remind when `rustup update` reports any toolchain has an update ready. 

![Screenshot demonstrating status item showing "rustup: nightly-aarch64-apple-darwin"](<Screenshot 2024-02-16 at 23.54.40.png>)

## Features

When a Rust file is open, a status bar item showing the current rustup toolchain will display on the left. Click it, and you will be able to select an argument that will be used with `rustup override set`.

## Requirements

Needs rustup to be installed & in the PATH.

## Extension Settings

No settings, but in the future the update check should be optional.

## Known Issues

If rustup isn't installed, may complain and throw errors. Maybe it should offer or explain how to install rustup instead?

Update selection quickpick is ugly and could use some styling instead of using raw ascii.