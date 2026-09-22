"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    //opens automatically
    openJournalDashboard();
    let disposable = vscode.commands.registerCommand('custom-dev-journal.openJournal', () => {
        openJournalDashboard();
    });
    context.subscriptions.push(disposable);
}
function openJournalDashboard() {
    const panel = vscode.window.createWebviewPanel('customDevJournal', 'Custom Dev Journal', vscode.ViewColumn.One, {
        enableScripts: true
    });
    panel.webview.html = getWebviewContent();
}
function getWebviewContent() {
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
function deactivate() { }
//# sourceMappingURL=extension.js.map