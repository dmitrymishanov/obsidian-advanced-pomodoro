import {App, Notice, PluginSettingTab, Setting} from "obsidian";
import AdvancedPomodoroPlugin from "./main";

export interface TimerSettings {
	workInterval: number;
	workIntervalOptions: number[];
	breakInterval: number;
	longBreakInterval: number;
	longBreakIntervalCount: number;
	enableCyclicMode: boolean;
	autoStartRestPeriod: boolean;
}

export interface LoggingSettings {
	enabled: boolean;
	logOn: 'start' | 'end';
	logTo: 'daily' | 'current' | 'custom';
	customLogFile: string;
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
	enableCyclicMode: false,
	autoStartRestPeriod: true,
}

export const DEFAULT_LOGGING_SETTINGS: LoggingSettings = {
	enabled: true,
	logOn: 'start',
	logTo: 'custom',
	customLogFile: 'Pomodoro Log.md',
	timestampFormat: '[🍅] [[[]YYYY-mm-DD[]]] HH:mm',
	appendPomodoroSize: true,
	appendActiveNote: true,
}

// TODO other settings
export const DEFAULT_SETTINGS: AdvancedPomodoroSettings = {
	timer: DEFAULT_TIMER_SETTINGS,
	logging: DEFAULT_LOGGING_SETTINGS,
}

export class AdvancedPomodoroSettingTab extends PluginSettingTab {
	plugin: AdvancedPomodoroPlugin;

	constructor(app: App, plugin: AdvancedPomodoroPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		// TODO: refactor 

		/**************  Timer settings **************/
		new Setting(containerEl)
			.setName('Timer')
			.setHeading();
		new Setting(containerEl)
			.setName('Default pomodoro time (minutes)')
			.addText(text => text
				.setValue(this.plugin.settings.timer.workInterval.toString())
				.onChange(async (value) => {
					this.plugin.settings.timer.workInterval = setInteger(value, DEFAULT_TIMER_SETTINGS.workInterval);
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
		new Setting(containerEl)
			.setName('Enable cyclic mode')
			.setDesc('Automatically start new pomodoro.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.timer.enableCyclicMode)
				.onChange(async (value) => {
					this.plugin.settings.timer.enableCyclicMode = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Auto-start break period')
			.setDesc('In non-cyclic mode, automatically start the break period when the pomodoro ends.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.timer.autoStartRestPeriod)
				.onChange(async (value) => {
					this.plugin.settings.timer.autoStartRestPeriod = value;
					await this.plugin.saveSettings();
				}));

		/**************  Logging settings **************/
		new Setting(containerEl)
			.setName('Logging')
			.setHeading();

		new Setting(containerEl)
			.setName('Enable logging')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.logging.enabled)
				.onChange(async (value) => {
					this.plugin.settings.logging.enabled = value;
					await this.plugin.saveSettings();
					// force refresh to show/hide the logging settings
					this.display();
				}));
		if (this.plugin.settings.logging.enabled) {
			new Setting(containerEl)
				.setName('When to log')
				.addDropdown(dropdown => dropdown
					.addOption('start', 'When the pomodoro starts')
					.addOption('end', 'When the pomodoro ends')
					.setValue(this.plugin.settings.logging.logOn)
					.onChange(async (value) => {
						this.plugin.settings.logging.logOn = value;
						await this.plugin.saveSettings();
					}));
			new Setting(containerEl)
				.setName('Log to')
				.addDropdown(dropdown => dropdown
					.addOption('daily', 'Daily note')
					.addOption('current', 'Active note')
					.addOption('custom', 'Custom file')
					.setValue(this.plugin.settings.logging.logTo)
					.onChange(async (value) => {
						this.plugin.settings.logging.logTo = value;
						await this.plugin.saveSettings();
						// force refresh to show/hide the custom log file input
						this.display();
					}));
			if (this.plugin.settings.logging.logTo === 'custom') {
				new Setting(containerEl)
					.setName('Log file path')
					.setDesc('If the file does not exist, it will be created.')
					.addText(text => text
						.setValue(this.plugin.settings.logging.customLogFile)
						.onChange(async (value) => {
							this.plugin.settings.logging.customLogFile = value || DEFAULT_LOGGING_SETTINGS.customLogFile;
							await this.plugin.saveSettings();
						}));
			}
			new Setting(containerEl)
				.setName('Timestamp format')
				.setDesc('Use momentjs format.')
				.addText(text => text
					.setValue(this.plugin.settings.logging.timestampFormat)
					.onChange(async (value) => {
						this.plugin.settings.logging.timestampFormat = value;
						await this.plugin.saveSettings();
					}));
			new Setting(containerEl)
				.setName('Append pomodoro size')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.logging.appendPomodoroSize)
					.onChange(async (value) => {
						this.plugin.settings.logging.appendPomodoroSize = value;
						await this.plugin.saveSettings();
					}));
			new Setting(containerEl)
				.setName('Append active note')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.logging.appendActiveNote)
					.onChange(async (value) => {
						this.plugin.settings.logging.appendActiveNote = value;
						await this.plugin.saveSettings();
					}));
		}
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