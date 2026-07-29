import { App, PluginSettingTab, Setting } from 'obsidian';
import GiteaSyncPlugin from './main';

export interface GiteaSyncSettings {
	repoUrl: string; // git@gitea.mydomain.com:user/repo.git or ssh://...
	sshPort: string;
	syncIntervalMinutes: number;
}

export const DEFAULT_SETTINGS: GiteaSyncSettings = {
	repoUrl: '',
	sshPort: '22',
	syncIntervalMinutes: 15
}

export class GiteaSyncSettingTab extends PluginSettingTab {
	plugin: GiteaSyncPlugin;

	constructor(app: App, plugin: GiteaSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Setting up sync with Gitea'});

		new Setting(containerEl)
			.setName('Git URL of repo')
			.setDesc('example: git@gitea.my-server.com:my-user/vault.git')
			.addText(text => text
				.setPlaceholder('git@...')
				.setValue(this.plugin.settings.repoUrl)
				.onChange(async (value) => {
					this.plugin.settings.repoUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('SSH Port')
			.setDesc('Default 22')
			.addText(text => text
				.setPlaceholder('22')
				.setValue(this.plugin.settings.sshPort)
				.onChange(async (value) => {
					this.plugin.settings.sshPort = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Autosync interval (in minutes)')
			.addText(text => text
				.setPlaceholder('15')
				.setValue(String(this.plugin.settings.syncIntervalMinutes))
				.onChange(async (value) => {
					const parsed = parseInt(value);
					if (!isNaN(parsed)) {
						this.plugin.settings.syncIntervalMinutes = parsed;
						await this.plugin.saveSettings();
						this.plugin.restartAutoSync();
					}
				}));
	}
}
