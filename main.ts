import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, SectionCache, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

interface ExpandedSectionCache extends SectionCache {
	text: string;
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	getTextFromPosition(fileText: string, start: number, end: number) {
		try {
			return fileText.substring(start, end);
		} catch (err) {
			console.log(err);
			return '';
		}
	}

	getAllActiveFiles() {
		/*
		ctime: 1630690494000
		mtime: 1630800156000
		size: 1186
		*/

		try {
			return this.app.vault.getFiles();
		} catch (err) {
			console.log(err);
			return [];
		}
	}

	resyncFilesAfterTimestamp (timestamp: number, files: TFile[]): TFile[] {

		if (files.length === 0) {
			console.log('No files found');
			return files;
		}

		if (timestamp == null) {
			console.log('Timestamp is null');
			return files;
		}

		return files.filter(file => file.stat.mtime > timestamp);
	}

	syncAllFiles (files: TFile[]) {

		if (files.length === 0) {
			return;
		}

		files.forEach(file => {
			console.log('Syncing file: ' + file.path);
		});
	}

	processBlockQuotes (blockquotes: SectionCache[], fileText: string): ExpandedSectionCache[] {
		const processedBlockquotes: ExpandedSectionCache[] = [];
		
		blockquotes.forEach(blockquote => {
			blockquote
			processedBlockquotes.push({
				text: this.getTextFromPosition(
					fileText, 
					blockquote.position.start.offset, 
					blockquote.position.end.offset
				), 
				...blockquote
			});
		});

		return processedBlockquotes;
	}

	processCodeBlocks (codeBlocks: SectionCache[], fileText: string): ExpandedSectionCache[] {
		const processedCodeBlocks: ExpandedSectionCache[] = [];
		
		codeBlocks.forEach(codeBlock => {
			processedCodeBlocks.push({
				text: this.getTextFromPosition(
					fileText, 
					codeBlock.position.start.offset, 
					codeBlock.position.end.offset
				),
				...codeBlock
			}
			);
		});

		return processedCodeBlocks;
	}

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', async (evt: MouseEvent) => {
			console.log('click', evt);

			const noteFile = this.app.workspace.getActiveFile(); // Get the currently Open Note
			const metadata = this.app.metadataCache.getFileCache(noteFile);
			const text = await this.app.vault.read(noteFile);
			// console.log(metadata)

			const blockquotes = metadata.sections.filter(section => section.type === 'blockquote');
			const paragraphs = metadata.sections.filter(section => section.type === 'paragraph');
			const lists = metadata.sections.filter(section => section.type === 'list');
			const codeBlocks = metadata.sections.filter(section => section.type === 'code');
			const html = metadata.sections.filter(section => section.type === 'html');

			console.log(paragraphs);
			console.log(lists);
	
			console.log(html);

			lists.forEach(section => {
				const res = this.getTextFromPosition(text, section.position.start.offset, section.position.end.offset);
				console.log(res.split('\n-'));
			})

			const blockquotesText = this.processBlockQuotes(blockquotes, text);
			console.log(blockquotesText);

			const codeBlocksText = this.processCodeBlocks(codeBlocks, text);
			console.log(codeBlocksText);

		});



		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
