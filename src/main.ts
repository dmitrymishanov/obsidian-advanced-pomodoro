import {Plugin} from 'obsidian';

import {DEFAULT_SETTINGS, AdvancedPomodoroSettings, AdvancedPomodoroSettingTab} from "./settings";
import { Timer, TimerState } from './timer';
import { formatTime } from './formatters';
import { Logger } from './logger';


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
			callback: () => this.timer.togglePause(),
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
			onTick: (remainingSeconds: number) => {
				this.statusBarEl.setText(`${this.getIcon()} ${formatTime(remainingSeconds)}`);
			},
			onStateChange: async (oldState: TimerState, newState: TimerState) => {
				if (newState == TimerState.Finished) {
					if (this.workState == WorkState.Work && (this.settings.timer.enableCyclicMode || this.settings.timer.autoStartRestPeriod)) {
						await this.takeBreak()
					} else if (this.workState == WorkState.Break && this.settings.timer.enableCyclicMode) {
						await this.startPomodoro()
					} else {
						this.stayIdle();
					}
				}
			},
			onSetInterval: (intervalId: number) => this.registerInterval(intervalId),
		});
	}
	initializeStatusBar() {
		this.statusBarEl = this.addStatusBarItem();
		this.statusBarEl.onClickEvent(() => {
			if (this.workState == WorkState.Idle) {
				this.startPomodoro()
			} else {
				this.timer.togglePause();
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
		this.timer.start(this.settings.timer.workInterval * 60);
		if (this.settings.logging.logOn == 'start') {
			await this.logger.log(this.settings.timer.workInterval, this.app.workspace.getActiveFile()?.path, this.settings.logging);
		}
	}
	async takeBreak() {
		this.pomodorosCount++;
		this.workState = WorkState.Break;
		const interval = this.pomodorosCount % this.settings.timer.longBreakIntervalCount == 0 ? this.settings.timer.longBreakInterval : this.settings.timer.breakInterval;
		this.timer.start(interval * 60);
		if (this.settings.logging.logOn == 'end') {
			await this.logger.log(interval, this.app.workspace.getActiveFile()?.path, this.settings.logging);
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
		this.timer.stop();
	}

	async prepareSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<AdvancedPomodoroSettings>);
		this.addSettingTab(new AdvancedPomodoroSettingTab(this.app, this));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
