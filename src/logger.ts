import { App, TFile } from "obsidian";
import { LoggingSettings } from "./settings";
import { getNoteSettings } from "./note-settings";

export class Logger {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async log(pomodoroSize: number, activeFile: TFile | null, settings: LoggingSettings): Promise<void> {
		if (!settings.enabled) {
			return;
		}

		try {
			let logLine = this.formatTimestamp(settings);
			if (settings.appendPomodoroSize) {
				logLine += ` ${pomodoroSize}m`;
			}

			const noteSettings = getNoteSettings(this.app, activeFile);
			if (settings.appendActiveNote && activeFile) {
				if (noteSettings.logNotes) {
					logLine +=  ` ${noteSettings.logNotes} ([[${activeFile.basename}]])`;
				} else {
					logLine += ` [[${activeFile.basename}]]`;
				}
			}

			if (noteSettings.logTags) {
				logLine += ` tags: ${noteSettings.logTags}`;
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

