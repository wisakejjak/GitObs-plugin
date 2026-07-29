import { Plugin, Notice, FileSystemAdapter } from 'obsidian';
import { GiteaSyncSettings, DEFAULT_SETTINGS, GiteaSyncSettingTab } from './settings';
import { GitManager } from './git';

export default class GiteaSyncPlugin extends Plugin {
	settings!: GiteaSyncSettings;
	gitManager: GitManager | null = null;
	syncIntervalId: number | null = null;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new GiteaSyncSettingTab(this.app, this));

		// Full path of vault
		const adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			const vaultPath = adapter.getBasePath();
			this.gitManager = new GitManager(vaultPath, this.settings.sshPort);
		} else {
			new Notice('Gitea Sync Plugin works only on local storage');
			return;
		}

		// Command for manual syncing (Ctrl+P)
		this.addCommand({
			id: 'sync-with-gitea',
			name: 'Sync now',
			callback: () => {
				this.performSync();
			}
		});

		// Auto-sync
		this.restartAutoSync();
	}

	async performSync() {
		if (!this.gitManager) return;
		
		const isRepo = await this.gitManager.isRepo();
		if (!isRepo) {
			new Notice('The current Vault is not a Git repository. Initialize it manually.');
			return;
		}

		new Notice('🔄 Syncing Gitea...');
		await this.gitManager.sync(`Auto-sync: ${new Date().toLocaleString()}`);
	}

	restartAutoSync() {
		// Clear old timer
		if (this.syncIntervalId) {
			window.clearInterval(this.syncIntervalId);
		}

		if (this.settings.syncIntervalMinutes > 0) {
			// min -> ms
			const intervalMs = this.settings.syncIntervalMinutes * 60 * 1000;
			
			// reg interval in Obsidian
			this.syncIntervalId = window.setInterval(() => {
				this.performSync();
			}, intervalMs);
			
			this.registerInterval(this.syncIntervalId);
		}
	}

	onunload() {
		if (this.syncIntervalId) {
			window.clearInterval(this.syncIntervalId);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update port
		if (this.gitManager && this.app.vault.adapter instanceof FileSystemAdapter) {
			this.gitManager = new GitManager(this.app.vault.adapter.getBasePath(), this.settings.sshPort);
		}
	}
}
