require('dotenv').config({ override: true });
const nodemailer = require('nodemailer');

/**
 * Sends an email with the deals.
 * @param {string} subject - The email subject.
 * @param {string} text - The plain text content.
 * @param {string} html - The HTML content.
 */
async function sendEmailNotification(subject, text, html) {
  const userEmail = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS; // This should be an App Password for Gmail
  const toEmail = process.env.EMAIL_TO || userEmail;

  if (!userEmail || !pass) {
    console.error('Error: EMAIL_USER or EMAIL_PASS missing in .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: userEmail,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"littlniss Bot" <${userEmail}>`,
    to: toEmail,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Successfully sent email:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

module.exports = { sendEmailNotification };
