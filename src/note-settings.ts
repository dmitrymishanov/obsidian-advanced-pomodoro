import { App, TFile } from 'obsidian';

export interface NoteSettings {
	workInterval?: number;
	breakInterval?: number;
	logNotes?: string;
	logTags?: string;
}

/**
 * Reads per-note timer settings from the frontmatter of the active file.
 */
export function getNoteSettings(app: App, file: TFile | null): NoteSettings {
	const noteSettings: NoteSettings = {};

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

	if (frontmatter.pomodoroLogNotes !== undefined) {
		const value = frontmatter.pomodoroLogNotes;
		if (typeof value === 'string' && value.trim() !== '') {
			noteSettings.logNotes = value.trim();
		} else if (Array.isArray(value)) {
			const items = value
				.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
				.map(item => item.trim());
			if (items.length > 0) {
				noteSettings.logNotes = items.join(', ');
			}
		}
	}

	if (frontmatter.pomodoroLogTags !== undefined) {
		const value = frontmatter.pomodoroLogTags;
		if (typeof value === 'string' && value.trim() !== '') {
			noteSettings.logTags = value.trim();
		} else if (Array.isArray(value)) {
			const items = value
				.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
				.map(item => item.trim());
			if (items.length > 0) {
				noteSettings.logTags = items.join(' ');
			}
		}
	}

	return noteSettings;
}
