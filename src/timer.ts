export enum TimerState {
	Idle = 'idle',
	Running = 'running',
	Paused = 'paused',
	Finished = 'finished',
}

export interface TimerCallbacks {
	onTick?: (remainingSeconds: number) => void;
	onStateChange?: (state: TimerState) => void;
    onSetInterval?: (intervalId: number) => void;
}

export class Timer {
	private _state: TimerState = TimerState.Idle;
    get state(): TimerState {
        return this._state;
    }
    set state(value: TimerState) {
        this._state = value;
        this.callbacks.onStateChange?.(value);
    }
	private remainingSeconds: number = 0;
	private intervalId: number | null = null;
	private callbacks: TimerCallbacks;

	constructor(callbacks: TimerCallbacks = {}) {
		this.callbacks = callbacks;
	}

	start(seconds: number): void {
		if (this.state === TimerState.Running) {
			return;
		}
		this.remainingSeconds = seconds;
		this.run();
	}

	pause(): void {
		if (this.state !== TimerState.Running) {
			return;
		}

		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}

		this.state = TimerState.Paused;
	}

	resume(): void {
		if (this.state !== TimerState.Paused) {
			return;
		}
		this.run();
	}

	stop(): void {
		if (this.state === TimerState.Idle || this.state === TimerState.Finished) {
			return;
		}
        this.finish();
	}

	private run(): void {
		this.state = TimerState.Running;
		this.intervalId = window.setInterval(() => {
			if (this.remainingSeconds > 0) {
				this.remainingSeconds--;
				this.callbacks.onTick?.(this.remainingSeconds);
			} else {
				this.finish();
			}
		}, 1000);
		this.callbacks.onSetInterval?.(this.intervalId);
	}

	private finish(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}

		this.state = TimerState.Finished;
		this.remainingSeconds = 0;
	}

	destroy(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}
}

