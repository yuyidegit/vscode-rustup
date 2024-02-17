import * as vscode from 'vscode';
import * as child_process from 'node:child_process';

let statusBarItem: vscode.StatusBarItem;
let dbgLog: vscode.OutputChannel;

function dbgStdio(proc: child_process.ChildProcess): child_process.ChildProcess {
	proc.stdout?.on('data', (chunk) => {
		dbgLog.append(chunk.toString());
	});
	proc.stderr?.on('data', (chunk) => {
		dbgLog.append(chunk.toString());
	});
	return proc;
}

function collectStdout(command: string, args: string[]): Promise<string> {
	let child = dbgStdio(child_process.spawn(command, args));

	let stdout: any[] = [];
	return new Promise((resolve, reject) => {
		child.stdout?.on('data', (chunk) => {
			stdout.push(Buffer.from(chunk));
		});
		child.on('close', (code) => {
			if (code === 0) {
				resolve(Buffer.concat(stdout).toString());
			} else {
				reject();
			}
		});
	});
}

function runToolchainUpdate(which: string): Promise<void> {
	return new Promise((resolve, reject) => {
		dbgLog.show();
		dbgLog.appendLine(`$ rustup update ${which}`);

		const process = dbgStdio(child_process.spawn('rustup', ['update', which]));
		process.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(code);
			}
		});
	});
}

function updateStatus() {
	collectStdout('rustup', ['show', 'active-toolchain']).then((data) => {
		let cur_toolchain = data.split(' ')[0];
		statusBarItem.text = `rustup: ${cur_toolchain}`;
		statusBarItem.show();
	});
}

export function activate({ subscriptions }: vscode.ExtensionContext) {
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	dbgLog = vscode.window.createOutputChannel('rustup');

	const checkUpdates = async () => {
		dbgLog.clear();
		let hours_to_wait = vscode.workspace.getConfiguration('rustup').get('updateInterval', 24);
		if (hours_to_wait == 0) {
			return;
		}
		setTimeout(checkUpdates, 1000 * 60 * 60 * hours_to_wait);

		let data = await collectStdout('rustup', ['check']);
		if (data.includes('Update available')) {
			vscode.window.showInformationMessage('rustup toolchain updates are available', 'Install All', 'Choose').then((selected) => {
				if (selected) {
					if (selected === 'Install All') {
						vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Updating toolchains...' }, async (progress, cancel) => {
							dbgStdio(child_process.spawn('rustup', ['update'])).on('exit', () => {
								progress.report({ increment: 100 });
								vscode.window.showInformationMessage('Rustup toolchain updates complete!');
							})
						});
					} else if (selected === 'Choose') {
						vscode.commands.executeCommand('rustup.checkUpdates');
					}
				}
			});
		}
	};
	updateStatus();
	checkUpdates();
	subscriptions.push(vscode.commands.registerCommand('rustup.listToolchains', () => {
		collectStdout('rustup', ['toolchain', 'list']).then((data) => {
			let lines = data.split('\n');
			vscode.window.showQuickPick(lines, { "title": "Change active toolchain?" }).then((selected) => {
				if (selected && vscode.window.activeTextEditor !== undefined) {
					var currentWorkspacePath = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)?.uri.fsPath;
					if (currentWorkspacePath === undefined) {
						vscode.window.showErrorMessage("cannot determine workspace of active editor");
					} else {
						dbgStdio(child_process.spawn('rustup', ['override', 'set', '--path', currentWorkspacePath, selected]).on('exit', () => updateStatus()));
					}
				} else if (selected) {
					vscode.window.showErrorMessage('No workspace folders found to set rustup override');
				}
			});
		});
	}));
	subscriptions.push(vscode.commands.registerCommand('rustup.checkUpdates', () => {
		collectStdout('rustup', ['check']).then((data) => {
			let lines = data.split('\n').filter((line) => line.includes('Update available') && line.split(' - ')[0] !== "rustup");
			if (lines.length !== 0) {
				vscode.window.showQuickPick(lines, { "canPickMany": true, "title": "Update selected toolchains?" }).then((selected) => {
					if (selected) {
						vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Updating toolchains...' }, async (progress, cancel) => {
							for (let item of selected) {
								let toolchain_name = item.split(' - ')[0];
								try {
									if (cancel.isCancellationRequested) { return; }
									await runToolchainUpdate(toolchain_name);
								} catch (error) {
									vscode.window.showErrorMessage(`Failed to update ${toolchain_name}`);
									return;
								}
								progress.report({ increment: 100 / selected.length, message: `Updated ${toolchain_name}` });
							}
							vscode.window.showInformationMessage('All toolchains updated successfully! 🥳');
						});
					}
				});
			} else {
				vscode.window.showInformationMessage('No updates available');
			}
		});
	}));
	subscriptions.push(statusBarItem);
	statusBarItem.command = "rustup.listToolchains";
}

export function deactivate() { }
