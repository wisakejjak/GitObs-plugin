import { exec } from 'child_process';
import { promisify } from 'util';
import { Notice } from 'obsidian';

const execAsync = promisify(exec);

export class GitManager {
    private basePath: string;
    private sshPort: string;

    constructor(basePath: string, sshPort: string) {
        // basePath - full path to vault
        this.basePath = basePath;
        this.sshPort = sshPort;
    }

    // support for Git commands
    private async run(command: string): Promise<string> {
        // custom SSH port
        const env = { 
            ...process.env, 
            GIT_SSH_COMMAND: `ssh -p ${this.sshPort} -o StrictHostKeyChecking=accept-new` 
        };

        try {
            const { stdout, stderr } = await execAsync(`git ${command}`, { 
                cwd: this.basePath,
                env: env 
            });
            return stdout;
        } catch (error) {
            console.error(`Git error on command '${command}':`, error);
            throw error;
        }
    }

    async isRepo(): Promise<boolean> {
        try {
            await this.run('rev-parse --is-inside-work-tree');
            return true;
        } catch {
            return false;
        }
    }

    async sync(commitMessage: string = "Auto-sync by Gitea Plugin"): Promise<void> {
        try {
            await this.run('add .');
            const status = await this.run('status --porcelain');
            const hasLocalChanges = status.trim() !== '';

            if (hasLocalChanges) {
                await this.run(`commit -m "${commitMessage}"`);
            }
            await this.run('pull --rebase origin main'); 
            await this.run('push origin main');
            new Notice('✅ Successfully synced with Gitea!');
        } catch (error) {
            new Notice('❌ Sync error. Check Ctrl+Shift+I.');
            console.error(error);
        }
    }
}
