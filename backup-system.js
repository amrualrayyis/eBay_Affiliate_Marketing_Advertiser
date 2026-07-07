const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { sendDiscordWebhook } = require('./discord-notifier');

async function runSystemBackup() {
  console.log('--- 🛡️ Starting littlniss System Backup ---');

  const zip = new AdmZip();
  const date = new Date().toISOString().split('T')[0];
  const backupName = `littlniss_backup_${date}.zip`;
  const backupDir = path.join(__dirname, 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  // Files to include in the DNA backup
  const filesToBackup = [
    'niches.json',
    'posted-items.json',
    'watchlist.json',
    'coupons.json',
    'littlniss-deals-log.csv',
    'social-media-bulk-schedule.csv',
    '.env'
  ];

  filesToBackup.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
      zip.addLocalFile(path.join(__dirname, file));
      console.log(`📦 Added ${file} to backup.`);
    }
  });

  // Also backup the last 10 posts
  if (fs.existsSync(path.join(__dirname, 'posts'))) {
    const images = fs.readdirSync(path.join(__dirname, 'posts')).slice(-10);
    images.forEach(img => {
        zip.addLocalFile(path.join(__dirname, 'posts', img), 'posts');
    });
    console.log('📦 Added latest visual assets to backup.');
  }

  const backupPath = path.join(backupDir, backupName);
  zip.writeZip(backupPath);

  console.log(`✅ Backup created: ${backupPath}`);

  // Notify Discord
  const embed = {
    title: "🛡️ littlniss Backup Successful",
    description: `A full snapshot of your empire's DNA has been saved.\n\n📄 **Archive:** \`${backupName}\`\n📁 **Location:** \`/backups\`\n💾 **Size:** ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB`,
    color: 3066993, // Green
    footer: { text: "littlniss Security & Recovery" },
    timestamp: new Date().toISOString(),
  };

  await sendDiscordWebhook(embed);
}

runSystemBackup();
