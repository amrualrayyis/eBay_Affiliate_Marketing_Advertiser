const fs = require('fs');
const path = require('path');

/**
 * Appends a deal to a bulk social media scheduling file (Buffer/Metricool format).
 * @param {Object} data - The post data.
 */
function logToBulkScheduler(data) {
  const filePath = path.join(__dirname, 'social-media-bulk-schedule.csv');
  const headers = 'Content,Link,Image_URL,Schedule_Date\n';

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, headers);
  }

  // Format: "Caption #hashtags", "Link", "ImageURL", ""
  const row = [
    `"${data.caption.replace(/"/g, '""')}"`,
    `"${data.link}"`,
    `"${data.imageUrl}"`,
    "" // Date left blank for the user to pick in the scheduling tool
  ].join(',') + '\n';

  try {
    fs.appendFileSync(filePath, row);
    console.log('📅 Added to Bulk Scheduler log.');
  } catch (e) {
    console.error('Bulk Scheduler Log Error:', e.message);
  }
}

module.exports = { logToBulkScheduler };
