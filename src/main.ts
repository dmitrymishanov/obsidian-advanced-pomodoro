import {Plugin} from 'obsidian';

import {DEFAULT_SETTINGS, AdvancedPomodoroSettings, AdvancedPomodoroSettingTab} from "./settings";
import { Timer, TimerState } from './timer';
import { formatTime } from './formatters';


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

	async onload() {
		await this.prepareSettings();

		this.initializeStatusBar();
		this.initializeTimer();
		
		this.stayIdle();

		this.addCommands();
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
			onStateChange: (oldState: TimerState, newState: TimerState) => {
				if ((oldState == TimerState.Idle || oldState == TimerState.Finished) && newState == TimerState.Running && this.settings.logging.logOn == 'start') {
					// TODO log on start
				}
				if (newState == TimerState.Finished) {
					if (this.workState == WorkState.Work && this.settings.logging.logOn == 'end') {
						// TODO log
					}

					if (this.workState == WorkState.Work && (this.settings.timer.enableCyclicMode || this.settings.timer.autoStartRestPeriod)) {
						
						this.takeBreak()
					} else if (this.workState == WorkState.Break && this.settings.timer.enableCyclicMode) {
						this.startPomodoro()
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
	startPomodoro() {
		this.workState = WorkState.Work;
		this.timer.start(this.settings.timer.workInterval);
	}
	takeBreak() {
		this.pomodorosCount++;
		this.workState = WorkState.Break;
		const interval = this.pomodorosCount % this.settings.timer.longBreakIntervalCount == 0 ? this.settings.timer.longBreakInterval : this.settings.timer.breakInterval;
		this.timer.start(interval);
	}

	getIcon(): string {
		if (this.workState == WorkState.Work) {
			return '🍅'
		}
		if (this.workState == WorkState.Break) {
			return 'palm'
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
