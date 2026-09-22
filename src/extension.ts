import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext){

	//opens automatically
	openJournalDashboard();

	let disposable = vscode.commands.registerCommand('custom-dev-journal.openJournal', () => {
		openJournalDashboard();
	});

	context.subscriptions.push(disposable);
}

function openJournalDashboard() {
	const panel = vscode.window.createWebviewPanel(
			'customDevJournal',
			'Custom Dev Journal',
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		);
	panel.webview.html = getWebviewContent();
}

function getWebviewContent(): string{
	return `<!DOCTYPE html>
	<html lang="en>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Custom Dev Journal</title>
		<script src="https://tailwindcss.com"></script>
	</head>
	<body class=bg-[#1e1e1e] text-[#cccccc] p-6 font-sans">
		<div class="max-w-4xl mx-auto">
			<h1 class="text-2xl font-bold text-white mb-2">Custom Dev Journal</h1>
			<p class="text-[#858585] border-b border[#333333] pb-4 mb-4">Your clean, all-in-one development workspace.</p>

			<div class="bg-[#252526] border border-[#333333] rounded-lg p-6 text-center">
				<p class="text-sm">Webview sandbox initiated successfully!</p>
				<p class="text-xs text-[#858585] mt-1">Next up: embedding your multi-module template logic.</p>
			</div>
		</div>
	</body>
	</html>`;
}

export function deactivate() {}