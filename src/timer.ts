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

	private _remainingSeconds: number = 0;
	get remainingSeconds() {
		return this._remainingSeconds;
	}
	set remainingSeconds(value: number) {
		this._remainingSeconds = value;
		this.callbacks.onTick?.(value);
		if (value == 0) {
			this.finish()
		}
	}

	private _intervalId: number | null = null;
	get intervalId(): number | null {
		return this._intervalId;
	}
	set intervalId(value: number | null) {
		this._intervalId = value;
		if (value !== null) {
			this.callbacks.onSetInterval?.(value);
		}
	}

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
		// immediately reduce remaining time to show that timer is working
		this.remainingSeconds--;
		this.run();
	}

	togglePause(): void {
		if (this.state == TimerState.Paused) {
			this.resume();
		} else if (this.state == TimerState.Running) {
			this.pause();
		}
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
			this.remainingSeconds--;
		}, 1000);
	}

	private finish(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}

		this.state = TimerState.Finished;
	}

	destroy(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}
}

