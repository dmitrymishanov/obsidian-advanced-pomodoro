import {App, Notice, PluginSettingTab, Setting} from "obsidian";
import AdvancedPomodoroPlugin from "./main";

export interface TimerSettings {
	workInterval: number;
	workIntervalOptions: number[];
	breakInterval: number;
	longBreakInterval: number;
	longBreakIntervalCount: number;
}

export interface LoggingSettings {
	enabled: boolean;
	logOn: 'start' | 'end';
	logTo: 'daily' | 'file' | 'note';
	file: string;
	timestampFormat: string;
	appendPomodoroSize: boolean;
	appendActiveNote: boolean;
}


export interface AdvancedPomodoroSettings {
	timer: TimerSettings;
	logging: LoggingSettings;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
	workInterval: 25,
	workIntervalOptions: [25, 50, 75],
	breakInterval: 5,
	longBreakInterval: 15,
	longBreakIntervalCount: 4,
}

export const DEFAULT_LOGGING_SETTINGS: LoggingSettings = {
	enabled: true,
	logOn: 'start',
	logTo: 'file',
	file: 'Pomodoro Log.md',
	timestampFormat: '[🍅] [[[]YYYY-mm-DD[]]] HH:mm',
	appendPomodoroSize: true,
	appendActiveNote: true,
}

// TODO other settings
export const DEFAULT_SETTINGS: AdvancedPomodoroSettings = {
	timer: DEFAULT_TIMER_SETTINGS,
	logging: DEFAULT_LOGGING_SETTINGS,
}

export class SampleSettingTab extends PluginSettingTab {
	plugin: AdvancedPomodoroPlugin;

	constructor(app: App, plugin: AdvancedPomodoroPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		/**************  Timer settings **************/
		containerEl.createEl('h2', { text: 'Timer Settings' });
		new Setting(containerEl)
			.setName('Default pomodoro time (minutes)')
			.addText(text => text
				.setValue(this.plugin.settings.timer.workInterval.toString())
				.onChange(async (value) => {
					console.log('BEFORE', value, DEFAULT_TIMER_SETTINGS.workInterval, this.plugin.settings.timer.workInterval);
					this.plugin.settings.timer.workInterval = setInteger(value, DEFAULT_TIMER_SETTINGS.workInterval, this.plugin.settings.timer.workInterval);
					console.log('AFTER', this.plugin.settings.timer.workInterval);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Pomodoro time options (minutes)')
			.addText(text => text
				.setValue(this.plugin.settings.timer.workIntervalOptions.join(","))
				.onChange(async (value) => {
					this.plugin.settings.timer.workIntervalOptions = setIntegerArray(value, DEFAULT_TIMER_SETTINGS.workIntervalOptions);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Short break time (minutes)')
			.addText(text => text
				.setValue(this.plugin.settings.timer.breakInterval.toString())
				.onChange(async (value) => {
					this.plugin.settings.timer.breakInterval = setInteger(value, DEFAULT_TIMER_SETTINGS.breakInterval);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Long break time (minutes)')
			.addText(text => text
				.setValue(this.plugin.settings.timer.longBreakInterval.toString())
				.onChange(async (value) => {
					this.plugin.settings.timer.longBreakInterval = setInteger(value, DEFAULT_TIMER_SETTINGS.longBreakInterval);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Number of pomodoros before a long break')
			.addText(text => text
				.setValue(this.plugin.settings.timer.longBreakIntervalCount.toString())
				.onChange(async (value) => {
					this.plugin.settings.timer.longBreakIntervalCount = setInteger(value, DEFAULT_TIMER_SETTINGS.longBreakIntervalCount);
					await this.plugin.saveSettings();
				}));
	}
}


function setInteger(value: string, defaultValue: number){
	if (!Number.isInteger(Number(value)) || (Number(value) <= 0)) {
		new Notice("Please specify a positive integer.");
		return defaultValue;
	}
	return Number(value);
}

function setIntegerArray(value: string, defaultValue: number[]){
	const numbers = value.split(",").map(Number);
	if (numbers.some(number => !Number.isInteger(number) || (number <= 0))) {
		new Notice("Please specify a comma-separated list of positive integers.");
		return defaultValue;
	}
	return numbers;
}