export enum TimerState {
	Idle = 'idle',
	Running = 'running',
	Paused = 'paused',
	Finished = 'finished',
}

export interface TimerCallbacks {
	onStateChange: (oldState: TimerState, newState: TimerState) => Promise<void>;
}

export class Timer {
	private _state: TimerState = TimerState.Idle;
    get state(): TimerState {
        return this._state;
    }
    set state(value: TimerState) {
		const oldState = this._state;
        this._state = value;
        this.callbacks.onStateChange(oldState, value).catch(console.error);
    }

	remainingMilliseconds: number = 0;
	// is not null only when timer is running
	private endTime: Date | null = null;;
	private callbacks: TimerCallbacks;

	constructor(callbacks: TimerCallbacks) {
		this.callbacks = callbacks;
	}

	start(milliseconds: number): void {
		if (this.state === TimerState.Running) {
			return;
		}
		this.remainingMilliseconds = milliseconds;
		this.run(milliseconds);
	}

	pause(): void {
		if (this.state !== TimerState.Running) {
			return;
		}
		this.state = TimerState.Paused;
	}

	resume(): void {
		if (this.state !== TimerState.Paused) {
			return;
		}
		this.run(this.remainingMilliseconds);
	}

	private run(milliseconds: number): void {
		this.endTime = new Date(Date.now() + milliseconds);
		this.state = TimerState.Running;
	}

	finish(): void {
		if (this.state === TimerState.Idle || this.state === TimerState.Finished) {
			return;
		}
		this.endTime = null;
		this.remainingMilliseconds = 0;
		this.state = TimerState.Finished;

	}

	stop(): void {
		this.endTime = null;
		this.remainingMilliseconds = 0;
		this.state = TimerState.Idle;
	}

	updateRemainingMilliseconds(): void {
		if (this.state === TimerState.Running && this.endTime !== null) {
			this.remainingMilliseconds = (this.endTime?.getTime() || 0) - Date.now();
		}
	}
	getFormattedTime(): string {
		const remainingSeconds = Math.floor(this.remainingMilliseconds / 1000);
		return `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`
	}
}

