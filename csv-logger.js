const fs = require('fs');
const path = require('path');

/**
 * Logs a deal to a local CSV file.
 * @param {Object} dealData - The data to log.
 */
function logDealToCSV(dealData) {
  const filePath = path.join(__dirname, 'littlniss-deals-log.csv');
  const headers = 'Date,Niche,Title,Price,Currency,Link,ImagePath,ImageUrl,BlogPost,FullContent\n';
  
  // Create file with headers if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, headers);
  }

  // Format the row (escaping commas and quotes in titles/posts)
  const row = [
    new Date().toLocaleDateString(),
    `"${dealData.nicheName}"`,
    `"${dealData.title.replace(/"/g, '""')}"`,
    dealData.price,
    dealData.currency,
    dealData.link,
    `"${dealData.imagePath || ''}"`,
    `"${dealData.imageUrl || ''}"`,
    `"${(dealData.blogPost || '').replace(/"/g, '""')}"`,
    `"${JSON.stringify(dealData.fullContent || {}).replace(/"/g, '""')}"`
  ].join(',') + '\n';

  try {
    fs.appendFileSync(filePath, row);
    console.log('📊 Deal logged to CSV.');
  } catch (error) {
    console.error('Failed to log to CSV:', error.message);
  }
}

module.exports = { logDealToCSV };
