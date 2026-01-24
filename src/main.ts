import {Plugin} from 'obsidian';

import {DEFAULT_SETTINGS, AdvancedPomodoroSettings, AdvancedPomodoroSettingTab} from "./settings";
import { Timer, TimerState } from './timer';
import { Logger } from './logger';
import { playNotificationSound } from './notifications';
import { getNoteTimerSettings } from './note-settings';


enum WorkState {
	Idle = 'idle',
	Work = 'work',
	Break = 'break',
}

export default class AdvancedPomodoroPlugin extends Plugin {
	settings: AdvancedPomodoroSettings;
	timer: Timer;
	private workState: WorkState = WorkState.Idle;
	statusBarEl: any
	pomodorosCount: number = 0;
	logger: Logger;
	intervalId: number | null = null;

	async onload() {
		await this.prepareSettings();

		this.initializeStatusBar();
		this.initializeTimer();
		
		this.stayIdle();

		this.addCommands();

		this.logger = new Logger(this.app);
	}

	addCommands() {
		this.addCommand({
			id: 'start-pomodoro',
			name: 'Start Pomodoro',
			icon: 'timer',
			callback: () => {
				if (this.workState === WorkState.Idle) {
					this.startPomodoro();
				}
			},
		});
		this.addCommand({
			id: 'toggle-pause',
			name: 'Pause / Resume',
			icon: 'pause',
			callback: () => this.toggleTimerPause(),
		});
		this.addCommand({
			id: 'finish-interval',
			name: 'Finish Interval',
			icon: 'circle-check-big',
			callback: () => this.timer.finish(),
		});
		this.addCommand({
			id: 'stop-timer',
			name: 'Stop Timer',
			icon: 'square',
			callback: () => this.stayIdle(),
		});
	}

	initializeTimer() {
		this.timer = new Timer({
			onStateChange: async (oldState: TimerState, newState: TimerState) => {
				if (newState !== TimerState.Running) {
					this.clearUpdateStatusBarInterval();
				}
				
				if (newState == TimerState.Running) {
					this.setUpdateStatusBarInterval();
				} else if (newState == TimerState.Finished) {
					if (this.settings.notification.enableSoundNotification) {
						playNotificationSound();
					}
					if (this.workState == WorkState.Work && (this.settings.timer.enableCyclicMode || this.settings.timer.autoStartRestPeriod)) {
						await this.takeBreak()
					} else if (this.workState == WorkState.Break && this.settings.timer.enableCyclicMode) {
						await this.startPomodoro()
					} else {
						this.stayIdle();
					}
				}
			},
		});
	}

	initializeStatusBar() {
		this.statusBarEl = this.addStatusBarItem();
		this.statusBarEl.onClickEvent(() => {
			if (this.workState == WorkState.Idle) {
				this.startPomodoro()
			} else {
				this.toggleTimerPause();
			}
		})
	}

	stayIdle() {
		this.pomodorosCount = 0;
		this.workState = WorkState.Idle;
		this.statusBarEl.setText('Start 🍅');
		this.timer.stop();
	}
	async startPomodoro() {
		this.workState = WorkState.Work;
		
		// Get work interval from note frontmatter or use default
		const activeFile = this.app.workspace.getActiveFile();
		const noteSettings = await getNoteTimerSettings(this.app, activeFile);
		const workInterval = noteSettings.workInterval ?? this.settings.timer.workInterval;
		
		this.timer.start(workInterval * 1000 * 60);
		if (this.settings.logging.logOn == 'start') {
			await this.logger.log(workInterval, activeFile?.path, this.settings.logging);
		}
	}
	async takeBreak() {
		this.pomodorosCount++;
		this.workState = WorkState.Break;
		
		const activeFile = this.app.workspace.getActiveFile();
		
		// Check if long break is needed
		const isLongBreak = this.pomodorosCount % this.settings.timer.longBreakIntervalCount == 0;
		
		let interval: number;
		if (isLongBreak) {
			// Long break always uses global setting
			interval = this.settings.timer.longBreakInterval;
		} else {
			// Get short break interval from note frontmatter or use default
			const noteSettings = await getNoteTimerSettings(this.app, activeFile);
			interval = noteSettings.breakInterval ?? this.settings.timer.breakInterval;
		}
		
		this.timer.start(interval * 1000 * 60);
		if (this.settings.logging.logOn == 'end') {
			await this.logger.log(interval, activeFile?.path, this.settings.logging);
		}
	}

	toggleTimerPause() {
		if (this.timer.state == TimerState.Paused) {
			this.timer.resume();
		} else if (this.timer.state == TimerState.Running) {
			this.timer.pause();
		}
	}

	setUpdateStatusBarInterval() {
		this.intervalId = this.registerInterval(window.setInterval(() => {
			this.timer.updateRemainingMilliseconds();
			if (this.timer.remainingMilliseconds <= 0) {
				this.timer.finish();
			} else {
				this.statusBarEl.setText(`${this.getIcon()} ${this.timer.getFormattedTime()}`);
			}
		}, 100));
	}

	clearUpdateStatusBarInterval() {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	getIcon(): string {
		if (this.workState == WorkState.Work) {
			return '🍅'
		}
		if (this.workState == WorkState.Break) {
			return '☕️'
		}
		return ''
	}

	onunload() {
		this.clearUpdateStatusBarInterval();
	}

	async prepareSettings() {
		const loadedData = await this.loadData() as Partial<AdvancedPomodoroSettings> || {};
		const mergedSettings: Partial<AdvancedPomodoroSettings> = {};
		
		for (const key in DEFAULT_SETTINGS) {
			const sectionKey = key as keyof AdvancedPomodoroSettings;
			mergedSettings[sectionKey] = Object.assign(
				{},
				DEFAULT_SETTINGS[sectionKey],
				loadedData[sectionKey]
			) as any;
		}
		
		this.settings = mergedSettings as AdvancedPomodoroSettings;
		this.addSettingTab(new AdvancedPomodoroSettingTab(this.app, this));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
