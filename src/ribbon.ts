import { Menu, Notice, setTooltip } from 'obsidian';
import AdvancedPomodoroPlugin, { WorkState } from './main';
import { TimerState } from './timer';

export class RibbonController {
	private plugin: AdvancedPomodoroPlugin;
	private iconEl: HTMLElement | null = null;

	constructor(plugin: AdvancedPomodoroPlugin) {
		this.plugin = plugin;
	}

	register(): void {
		this.iconEl = this.plugin.addRibbonIcon('timer', 'Pomodoro', (evt) => {
			this.openMenu(evt);
		});
		this.refresh();
	}

	refresh(): void {
		if (!this.iconEl) return;

		const { workState, timer } = this.plugin;

		if (workState === WorkState.Idle) {
			setTooltip(this.iconEl, 'Pomodoro — idle');
			return;
		}

		timer.updateRemainingMilliseconds();
		const timeLabel = timer.getFormattedTime();
		const prefix = workState === WorkState.Work ? '🍅 Pomodoro' : '☕ Break';
		const suffix = timer.state === TimerState.Paused ? ' (paused)' : '';
		setTooltip(this.iconEl, `${prefix} — ${timeLabel}${suffix}`);
	}

	unregister(): void {
		this.iconEl?.remove();
		this.iconEl = null;
	}

	private openMenu(evt: MouseEvent): void {
		const menu = new Menu();
		const { workState, timer } = this.plugin;

		if (workState === WorkState.Idle) {
			menu.addItem((item) =>
				item
					.setTitle('Start pomodoro')
					.setIcon('play')
					.onClick(() => this.plugin.startPomodoro())
			);
			menu.showAtMouseEvent(evt);
			return;
		}

		timer.updateRemainingMilliseconds();
		const timeLabel = timer.getFormattedTime();
		const header =
			workState === WorkState.Work
				? `🍅 ${timeLabel} remaining`
				: `☕ ${timeLabel} remaining`;

		menu.addItem((item) => item.setTitle(header).setDisabled(true));
		menu.addSeparator();

		if (timer.state === TimerState.Running) {
			menu.addItem((item) =>
				item
					.setTitle('Pause')
					.setIcon('pause')
					.onClick(() => this.plugin.toggleTimerPause())
			);
		} else if (timer.state === TimerState.Paused) {
			menu.addItem((item) =>
				item
					.setTitle('Resume')
					.setIcon('play')
					.onClick(() => this.plugin.toggleTimerPause())
			);
		}

		menu.addItem((item) =>
			item
				.setTitle('Finish interval')
				.setIcon('circle-check-big')
				.onClick(() => this.plugin.timer.finish())
		);
		menu.addItem((item) =>
			item
				.setTitle('Stop')
				.setIcon('square')
				.onClick(() => {
					new Notice('Timer stopped');
					this.plugin.stayIdle();
				})
		);

		menu.showAtMouseEvent(evt);
	}
}
