import { App, TFile } from 'obsidian';

export interface NoteTimerSettings {
	workInterval?: number;
	breakInterval?: number;
}

/**
 * Reads per-note timer settings from the frontmatter of the active file.
 */
export async function getNoteTimerSettings(app: App, file: TFile | null): Promise<NoteTimerSettings> {
	const noteSettings: NoteTimerSettings = {};

	if (!file) {
		return noteSettings;
	}

	const metadata = app.metadataCache.getFileCache(file);
	if (!metadata?.frontmatter) {
		return noteSettings;
	}

	const frontmatter = metadata.frontmatter;

	if (frontmatter.pomodoroWorkInterval !== undefined) {
		const value = Number(frontmatter.pomodoroWorkInterval);
		if (Number.isInteger(value) && value > 0) {
			noteSettings.workInterval = value;
		}
	}

	if (frontmatter.pomodoroBreakInterval !== undefined) {
		const value = Number(frontmatter.pomodoroBreakInterval);
		if (Number.isInteger(value) && value > 0) {
			noteSettings.breakInterval = value;
		}
	}

	return noteSettings;
}
