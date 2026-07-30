README in TDL

but for now:

## Features

- **SSH custom ports** - Designed to work smoothly with self-hosted Gitea instances running on non-standard SSH ports.
- **Automated Background Sync** - Periodically commits, pulls (via rebase), and pushes your changes at user-defined intervals.
- **Manual Sync Command** - via Ctrl+P "Sync Now"
- **Native System Git** - Uses your system's `git` binary and native SSH keys (`~/.ssh`), eliminating the need to store credentials in Obsidian.

## Prerequistes

1. Git
2. SSH
3. Initialized Vault repo - Your Obsidian vault must already be initialized as a Git repository tracking a remote branch.

## Initial Vault Setup

Before using the plugin, initialize your Obsidian vault as a Git repository once from your terminal:

```bash
cd /path/to/your/vault

# Initialize repository
git init
git branch -M main

# Ignore local Obsidian workspace state
echo ".obsidian/workspace" >> .gitignore
echo ".obsidian/workspace-mobile" >> .gitignore
echo ".DS_Store" >> .gitignore

# Link your Gitea repository
git remote add origin git@gitea.your-domain.com:your-user/your-vault.git

# Initial commit and push
git add .
git commit -m "Initial commit from Obsidian"
git push -u origin main
```

## Plugin Configuration

1. Open "Obsidian Settings" -> "Community Plugins" and enable **Gitea Sync Plugin**
2. Navigate to Gitea Sync Settings at the bottom of the left sidebar:
    * Git URL: Your Gitea SSH repo URL (e.g., git@gitea.domain.com:user/vault.git)
    * SSH Port: Set your custom SSH port (default is 22)
    * Sync interval: Auto-sync frequency in minutes (set to 0 to disable)

## Builing from Source

```bash
# Clone the repository
git clone [https://github.com/your-username/GitObs-plugin.git](https://github.com/your-username/GitObs-plugin.git)
cd GitObs-plugin

# Install dependencies
npm install

# Build for production
npm run build
```
