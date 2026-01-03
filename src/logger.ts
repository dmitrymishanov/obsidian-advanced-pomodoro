import { App, TFile } from "obsidian";
import { LoggingSettings } from "./settings";

export class Logger {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async log(pomodoroSize: number, activeNote: string | undefined, settings: LoggingSettings): Promise<void> {
		if (!settings.enabled) {
			return;
		}

		try {
			let logLine = this.formatTimestamp(settings);
			if (settings.appendPomodoroSize) {
				logLine += ` ${pomodoroSize}m`;
			}

			if (settings.appendActiveNote && activeNote) {
				logLine += ` [[${activeNote}]]`;
			}

			const file = this.app.vault.getAbstractFileByPath(settings.logFile);
            if (!file || !(file instanceof TFile)) {
				await this.app.vault.create(settings.logFile, "");
			}
			if (file instanceof TFile) {
				await this.app.vault.append(file, `\n${logLine}`);
			}
		} catch (error) {
			console.error("Failed to write log:", error);
		}
	}

	private formatTimestamp(settings: LoggingSettings): string {
        const moment = (window as any).moment;
        return moment().format(settings.timestampFormat);
    }
}

