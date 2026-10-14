import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { isAbsolute, join } from 'path';
import { Notice } from 'obsidian';

const execFileAsync = promisify(execFile);

export class GitManager {
    private basePath: string;
    private sshPort: string;

    constructor(basePath: string, sshPort: string) {
        // basePath - full path to vault
        this.basePath = basePath;
        this.sshPort = sshPort;
    }

    // support for Git commands
    private async run(args: string[]): Promise<string> {
        // custom SSH port
        const env = {
            ...process.env,
            GIT_SSH_COMMAND: `ssh -p ${this.sshPort} -o StrictHostKeyChecking=accept-new`
        };

        try {
            const { stdout } = await execFileAsync('git', args, {
                cwd: this.basePath,
                env: env
            });
            return stdout;
        } catch (error) {
            console.error(`Git error on command 'git ${args.join(' ')}':`, error);
            throw error;
        }
    }

    async isRepo(): Promise<boolean> {
        try {
            await this.run(['rev-parse', '--is-inside-work-tree']);
            return true;
        } catch {
            return false;
        }
    }

    // detect a stuck rebase before touching anything:
    // running add/commit mid-rebase creates commits on detached HEAD and corrupts state
    private async rebaseStateDir(): Promise<string | null> {
        try {
            const gitDir = (await this.run(['rev-parse', '--git-dir'])).trim();
            const abs = isAbsolute(gitDir) ? gitDir : join(this.basePath, gitDir);
            if (existsSync(join(abs, 'rebase-merge')) || existsSync(join(abs, 'rebase-apply'))) {
                return abs;
            }
        } catch {
            // not a repo or git error — nothing to guard
        }
        return null;
    }

    async sync(commitMessage: string = "Auto-sync by Gitea Plugin"): Promise<void> {
        const inRebase = await this.rebaseStateDir();
        if (inRebase) {
            new Notice('⚠️ Rebase in progress. Finish (git rebase --continue) or abort (git rebase --abort) it manually, then run Sync again.');
            return;
        }

        try {
            // branch of the current HEAD (no hardcoded 'main')
            const branch = (await this.run(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();

            await this.run(['add', '.']);
            const status = await this.run(['status', '--porcelain']);
            const hasLocalChanges = status.trim() !== '';

            if (hasLocalChanges) {
                await this.run(['commit', '-m', commitMessage]);
            }

            await this.run(['fetch', 'origin']);

            // rebase only if we are actually behind the remote
            const counts = (await this.run(['rev-list', '--left-right', '--count', `HEAD...origin/${branch}`])).trim().split(/\s+/);
            const behind = parseInt(counts[1] ?? '0', 10);

            if (behind > 0) {
                try {
                    // --autostash: unsaved edits in Obsidian don't block the rebase
                    await this.run(['rebase', '--autostash', `origin/${branch}`]);
                } catch {
                    // conflict (or autostash conflict): abort to keep the state clean.
                    // local commits are preserved — resolve once manually, sync picks up from there
                    await this.run(['rebase', '--abort']).catch(() => { });
                    new Notice('❌ Conflict while rebasing onto remote. Rebase aborted, local commits kept. Resolve the conflict manually, then run Sync again.');
                    return;
                }
            }

            await this.run(['push', 'origin', branch]);
            new Notice('✅ Successfully synced with Gitea!');
        } catch (error) {
            new Notice('❌ Sync error. Check Ctrl+Shift+I.');
            console.error(error);
        }
    }
}
