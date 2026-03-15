/**
 * Git Sync Dev Agent v1.0
 * Specialized for 04_Dev folder synchronization with GitHub.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DEV_DIR = path.join(__dirname, '..'); // Executed from scripts/

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m'
};

function run(command, cwd) {
    try {
        return execSync(command, { cwd, encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
        throw new Error(error.stderr || error.message);
    }
}

function main() {
    console.log(`\n${colors.bright}${colors.cyan}⚓ CANLK DEV DEPLOYMENT AGENT${colors.reset}\n`);

    if (!fs.existsSync(path.join(DEV_DIR, '.git'))) {
        console.error(`${colors.red}❌ Error: No Git repository found in ${DEV_DIR}${colors.reset}`);
        process.exit(1);
    }

    try {
        // 1. Add changes
        console.log(`${colors.yellow} Staging changes...${colors.reset}`);
        run('git add .', DEV_DIR);
        console.log(`${colors.green} ✓ Changes staged${colors.reset}`);

        // 2. Commit
        const timestamp = new Date().toLocaleString('fr-FR');
        const commitMsg = `feat(dev): technical update - ${timestamp}`;
        console.log(`${colors.yellow} Creating commit: ${colors.reset}"${commitMsg}"`);
        run(`git commit -m "${commitMsg}"`, DEV_DIR);
        console.log(`${colors.green} ✓ Committed locally${colors.reset}`);

        // 3. Push
        console.log(`${colors.yellow} Pushing to GitHub (origin/main)...${colors.reset}`);
        run('git push origin main', DEV_DIR);
        console.log(`${colors.green} ✓ Successfully pushed to GitHub${colors.reset}\n`);

        console.log(`${colors.bright}${colors.green}🚀 DEPLOYMENT COMPLETE${colors.reset}\n`);
    } catch (error) {
        if (error.message.includes('nothing to commit')) {
            console.log(`${colors.cyan} ℹ No changes to deploy.${colors.reset}\n`);
        } else {
            console.error(`${colors.red}❌ Git Error: ${error.message}${colors.reset}`);
            process.exit(1);
        }
    }
}

main();
