import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface TaskItem{
	id: string;
	text: string;
	completed: boolean;
	urgent: boolean;
}

interface JournalLog{
	date: string;
	text: string;
}

export function activate(context: vscode.ExtensionContext) {
	const provider = new CustomDevJournalProvider(context);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('custom-dev-journal-view', provider)
	);

	let openCommand = vscode.commands.registerCommand('custom-dev-journal.openJournal', () => {
		vscode.commands.executeCommand('workbench.view.extension.custom-dev-journal-view');
	});

	context.subscriptions.push(openCommand);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if(e.affectsConfiguration('customDevJournal.theme')) {
				provider.refreshTheme();
			}
		})
	);
}

class CustomDevJournalProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(private readonly _context: vscode.ExtensionContext) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._context.extensionUri]
		};

		this.updateHtml();

		webviewView.webview.onDidReceiveMessage(async (message) => {
			switch(message.type){
				case 'saveTasks':
					await this._context.globalState.update('saved_tasks_list', message.data);
					break;
				case 'saveJournal':	
					await this._context.globalState.update('saved_journal_log', message.data);
					break;
				case 'requestData':
					this.sendStoredData();
					break;
			}
		});
	}

	public refreshTheme() {
		if(this._view){
			this.updateHtml();
		}
	}

	private sendStoredData() {
		if(!this._view) {return;}

		const tasks = this._context.globalState.get<TaskItem[]>('saved_tasks_list', []);
		const journal = this._context.globalState.get<JournalLog[]>('saved_journal_log', [{date: '', text: ''}]);

		this._view.webview.postMessage({
			type: 'hydrateState',
			tasks: tasks,
			journal: journal
		});
	}

	private updateHtml(){
		if(!this._view) {return;}

		const config = vscode.workspace.getConfiguration('customDevJournal');
		const activeThemeKey = config.get<string>('theme') || 'cosmic-night';

		let themeColors = {
			bgDeepSpace: "#050816",
            bgVoid: "#090414",
            surfaceCard: "#1F1537",
            surfaceButton: "#102841",
            accentGold: "#F1B775",
            accentCrimson: "#B13B3B"
		};

		try{
			const themePath = path.join(this._context.extensionPath, 'themes.json');
			if(fs.existsSync(themePath)){
				const themesData = JSON.parse(fs.readFileSync(themePath, 'utf-8'));
				if(themesData[activeThemeKey]){
					themeColors = themesData[activeThemeKey];
				}
			}
		} catch (error) {
			console.error("Error reading themes.json template bundle:", error);
		}
		
		this._view.webview.html = this.getWebviewContent(themeColors);
	}

	        private getWebviewContent(colors: any): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Custom Dev Journal</title>
            <script src="https://tailwindcss.com"></script>
            <script>
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                deepSpace: '${colors.bgDeepSpace}',
                                voidSpace: '${colors.bgVoid}',
                                cardSurface: '${colors.surfaceCard}',
                                buttonSurface: '${colors.surfaceButton}',
                                goldAccent: '${colors.accentGold}',
                                crimsonAccent: '${colors.accentCrimson}'
                            }
                        }
                    }
                }
            </script>
            <style>
                /* Smooth custom scrollbar styling for a native look */
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: ${colors.surfaceButton}; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: ${colors.accentGold}; }
            </style>
        </head>
        <body class="bg-deepSpace text-white p-3 font-sans selection:bg-goldAccent selection:text-voidSpace select-none">
            <div class="w-full space-y-4">
                <!-- Header Banner -->
                <div>
                    <h1 class="text-lg font-bold text-goldAccent tracking-wide">Cosmic Command</h1>
                    <p class="text-[10px] text-gray-400 border-b border-cardSurface/60 pb-2">Task Planner & Workspace Manager</p>
                </div>

                <!-- TASK PLANNER INTERFACE -->
                <div class="space-y-2">
                    <div class="flex gap-1.5 items-center">
                        <input type="text" id="taskInput" placeholder="Add a new cosmic mission..." 
                            class="flex-1 min-w-0 bg-voidSpace border border-cardSurface text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-goldAccent text-white placeholder-gray-500">
                        
                        <button id="urgentToggle" title="Toggle Urgent Status"
                            class="px-2.5 py-1.5 bg-voidSpace border border-cardSurface text-xs rounded hover:border-crimsonAccent transition-colors text-gray-400">
                            🚨
                        </button>
                        
                        <button id="addTaskBtn" 
                            class="px-3 py-1.5 bg-buttonSurface hover:bg-goldAccent hover:text-voidSpace text-xs font-semibold rounded transition-colors whitespace-nowrap">
                            Add
                        </button>
                    </div>

                    <!-- Tasks Frame Container -->
                    <div id="taskList" class="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                        <!-- Items dynamically injected here -->
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let tasksArray = [];
                let isUrgentSelected = false;

                // UI Elements Elements Hooks
                const taskInput = document.getElementById('taskInput');
                const urgentToggle = document.getElementById('urgentToggle');
                const addTaskBtn = document.getElementById('addTaskBtn');
                const taskList = document.getElementById('taskList');

                // Toggle urgency filter context state
                urgentToggle.addEventListener('click', () => {
                    isUrgentSelected = !isUrgentSelected;
                    if(isUrgentSelected) {
                        urgentToggle.classList.remove('border-cardSurface', 'text-gray-400');
                        urgentToggle.classList.add('border-crimsonAccent', 'bg-crimsonAccent/10');
                    } else {
                        urgentToggle.classList.add('border-cardSurface', 'text-gray-400');
                        urgentToggle.classList.remove('border-crimsonAccent', 'bg-crimsonAccent/10');
                    }
                });

                // Add Task Logic triggers
                addTaskBtn.addEventListener('click', createNewTask);
                taskInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') createNewTask(); });

                function createNewTask() {
                    const text = taskInput.value.trim();
                    if (!text) return;

                    const newTask = {
                        id: Date.now().toString(),
                        text: text,
                        completed: false,
                        urgent: isUrgentSelected
                    };

                    tasksArray.push(newTask);
                    taskInput.value = '';
                    
                    // Reset urgency switch state
                    if (isUrgentSelected) urgentToggle.click();

                    renderTasks();
                    saveDataToBackend();
                }

                function renderTasks() {
                    taskList.innerHTML = '';
                    
                    if(tasksArray.length === 0) {
                        taskList.innerHTML = '<p class="text-[11px] text-gray-500 italic text-center py-4">No tasks found in orbit.</p>';
                        return;
                    }

                    tasksArray.forEach(task => {
                        const row = document.createElement('div');
                        
                        // Pick background layer styling based on urgency setting
                        const borderStyle = task.urgent ? 'border-l-2 border-l-crimsonAccent border-voidSpace' : 'border-voidSpace';
                        const opacityStyle = task.completed ? 'opacity-50' : 'opacity-100';
                        
                        row.className = 'flex items-center justify-between gap-2 p-2 bg-cardSurface rounded border ' + borderStyle + ' ' + opacityStyle + ' transition-opacity';

                        // Text wrapping element click setup
                        const textSpan = document.createElement('span');
                        textSpan.className = 'text-xs cursor-pointer truncate flex-1 ' + (task.completed ? 'line-through text-goldAccent' : 'text-white');
                        textSpan.textContent = task.text;
                        textSpan.addEventListener('click', () => toggleTaskCompletion(task.id));

                        // Delete Trash action anchor
                        const delBtn = document.createElement('button');
                        delBtn.className = 'text-gray-500 hover:text-crimsonAccent text-xs px-1 transition-colors';
                        delBtn.innerHTML = '✕';
                        delBtn.addEventListener('click', () => deleteTask(task.id));

                        row.appendChild(textSpan);
                        row.appendChild(delBtn);
                        taskList.appendChild(row);
                    });
                }

                function toggleTaskCompletion(id) {
                    tasksArray = tasksArray.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
                    renderTasks();
                    saveDataToBackend();
                }

                function deleteTask(id) {
                    tasksArray = tasksArray.filter(t => t.id !== id);
                    renderTasks();
                    saveDataToBackend();
                }

                function saveDataToBackend() {
                    vscode.postMessage({ type: 'saveTasks', data: tasksArray });
                }

                // Initial Startup Request Event handlers
                window.addEventListener('load', () => {
                    vscode.postMessage({ type: 'requestData' });
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.type === 'hydrateState') {
                        tasksArray = message.tasks || [];
                        renderTasks();
                    }
                });
            </script>
        </body>
        </html>`;
    }

}

export function deactivate() {}