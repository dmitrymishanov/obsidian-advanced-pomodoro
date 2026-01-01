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

	async onload() {
		await this.prepareSettings();

		this.initializeStatusBar();
		this.stayIdle();
		

		this.timer = new Timer({
			onTick: (remainingSeconds: number) => {
				this.statusBarEl.setText(`${this.getIcon()} ${formatTime(remainingSeconds)}`);
			},
			onStateChange: (state: TimerState) => {
				if (state == TimerState.Finished) {
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
		this.workState = WorkState.Idle;
		this.statusBarEl.setText('Start 🍅');
	}
	startPomodoro() {
		this.workState = WorkState.Work;
		this.timer.start(this.settings.timer.workInterval);
	}
	takeBreak() {
		this.workState = WorkState.Break;
		this.timer.start(this.settings.timer.breakInterval);
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
