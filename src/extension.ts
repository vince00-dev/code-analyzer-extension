import * as vscode from 'vscode';
import * as path from 'path';

interface FileMetrics {
    fileName: string;
    totalLines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
    functions: number;
    classes: number;
    complexity: number;
}

export function activate(context: vscode.ExtensionContext) {
	const analyzeFileCommand = vscode.commands.registerCommand('codeMetrics.analyzeFile', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('Откройте файл для анализа');
			return;
		}

		const document = editor.document;
		const content = document.getText();
		const fileName = path.basename(document.fileName);

		const metrics = analyzeFile(content, fileName);
		const report = formatMetrics(metrics);

		const panel = vscode.window.createWebviewPanel(
			'codeMetrics',
			'Метрики кода',
			vscode.ViewColumn.Two,
			{}
		);

		panel.webview.html = getWebviewContent(report);
	});

	context.subscriptions.push(analyzeFileCommand);
}

function analyzeFile(content: string, fileName: string): FileMetrics {
    const lines = content.split('\n');
    let totalLines = lines.length;
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    let functions = 0;
    let classes = 0;
    let complexity = 1;

    let inMultiLineComment = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === '') {
            blankLines++;
            continue;
        }

        if (trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
            inMultiLineComment = true;
            commentLines++;
            continue;
        }

        if (inMultiLineComment) {
            commentLines++;
            if (trimmed.includes('*/')) {
                inMultiLineComment = false;
            }
            continue;
        }

        if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
            commentLines++;
            continue;
        }

        codeLines++;

        if (trimmed.match(/^\s*(function|def|fn)\s+\w+/)) {
            functions++;
        }

        if (trimmed.match(/^\s*(class|interface|struct)\s+\w+/)) {
            classes++;
        }

        if (trimmed.match(/\b(if|else|while|for|switch|case|catch|\?)\b/)) {
            complexity++;
        }
    }

    return {
        fileName,
        totalLines,
        codeLines,
        commentLines,
        blankLines,
        functions,
        classes,
        complexity
    };
}

function formatMetrics(metrics: FileMetrics): string {
    let result = `Метрики файла: ${metrics.fileName}\n\n`;
    result += `Строки:\n`;
    result += `  Всего строк: ${metrics.totalLines}\n`;
    result += `  Строк кода: ${metrics.codeLines}\n`;
    result += `  Комментариев: ${metrics.commentLines}\n`;
    result += `  Пустых строк: ${metrics.blankLines}\n\n`;
    result += `Структура:\n`;
    result += `  Функций: ${metrics.functions}\n`;
    result += `  Классов: ${metrics.classes}\n\n`;
    result += `Сложность:\n`;
    result += `  Цикломатическая сложность: ${metrics.complexity}\n`;

    if (metrics.complexity > 20) {
        result += `  Высокая сложность\n`;
    } else if (metrics.complexity > 10) {
        result += `  Средняя сложность\n`;
    } else {
        result += `  Низкая сложность\n`;
    }

    return result;
}

function getWebviewContent(text: string): string {
	const htmlText = text.replace(/\n/g, '<br>').replace(/ {2}/g, '&nbsp;&nbsp;');
	return `<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Метрики кода</title>
	<style>
		body {
			font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
			padding: 20px;
			line-height: 1.6;
			background-color: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
		}
		pre {
			background: var(--vscode-textBlockQuote-background);
			padding: 15px;
			border-radius: 5px;
			white-space: pre-wrap;
			font-family: 'Courier New', monospace;
		}
	</style>
</head>
<body>
	<pre>${htmlText}</pre>
</body>
</html>`;
}

export function deactivate() {}
