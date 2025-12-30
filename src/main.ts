import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, AdvancedPomodoroSettings, AdvancedPomodoroSettingTab} from "./settings";
import { Timer } from './timer';


export default class AdvancedPomodoroPlugin extends Plugin {
	settings: AdvancedPomodoroSettings;
	timer: Timer;

	async onload() {
		await this.prepareSettings();
		this.timer = new Timer();
	}

	onunload() {
		this.timer.destroy();
	}

	async prepareSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<AdvancedPomodoroSettings>);
		this.addSettingTab(new AdvancedPomodoroSettingTab(this.app, this));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
