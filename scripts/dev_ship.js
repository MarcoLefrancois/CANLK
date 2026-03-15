/**
 * Dev Ship Orchestrator v1.0
 * Coordinates technical reporting and GitHub deployment.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const SCRIPTS_DIR = __dirname;

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    magenta: '\x1b[35m',
    white: '\x1b[37m'
};

function runScript(name) {
    console.log(`${colors.magenta} Running ${name}...${colors.reset}`);
    const result = spawnSync('node', [path.join(SCRIPTS_DIR, name)], { stdio: 'inherit' });
    return result.status === 0;
}

function main() {
    console.log(`\n${colors.bright}${colors.magenta}🚢 PREPARING DEV SHIPMENT${colors.reset}`);
    console.log(`${colors.white}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

    // Step 1: Generate Release Notes
    if (!runScript('dev_release_notes.js')) {
        console.error('\n❌ Ship aborted: Failed to generate release notes.');
        process.exit(1);
    }

    console.log('');

    // Step 2: Sync with GitHub
    if (!runScript('git_sync_dev.js')) {
        console.error('\n❌ Ship aborted: Git synchronization failed.');
        process.exit(1);
    }

    console.log(`${colors.bright}${colors.magenta}🏁 SHIPMENT VERIFIED AND DELIVERED${colors.reset}\n`);
}

main();
