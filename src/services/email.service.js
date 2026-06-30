require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});



// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
    const subject = "Welcome to Backend Ledger";

    const text = `
Hello ${name},

Welcome to Backend Ledger!

Thank you for registering with us. Your account has been created successfully.

You can now log in and start using Backend Ledger.

If you did not create this account, please ignore this email.

Best regards,
Backend Ledger Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Welcome to Backend Ledger</title>
</head>

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,.08);">

<tr>
<td style="background:#2563eb;padding:30px;text-align:center;color:#ffffff;">
<h1 style="margin:0;">Backend Ledger</h1>
<p style="margin:8px 0 0;">Welcome to our community</p>
</td>
</tr>

<tr>
<td style="padding:40px;color:#333333;">

<h2 style="margin-top:0;">Hello ${name},</h2>

<p>
Thank you for registering with <strong>Backend Ledger</strong>.
We're excited to have you with us.
</p>

<p>
Your account has been created successfully and is ready to use.
</p>

<p>
We hope Backend Ledger helps you manage your work efficiently.
</p>

<div style="text-align:center;margin:35px 0;">
<a href="https://yourwebsite.com/login"
style="
background:#2563eb;
color:#ffffff;
padding:14px 28px;
text-decoration:none;
border-radius:6px;
font-weight:bold;
display:inline-block;">
Login to Your Account
</a>
</div>

<p>
If you didn't create this account, you can safely ignore this email.
</p>

<p>
Thank you,<br>
<strong>Backend Ledger Team</strong>
</p>

</td>
</tr>

<tr>
<td style="background:#f7f7f7;padding:20px;text-align:center;font-size:13px;color:#777777;">
© 2026 Backend Ledger. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = "Transaction Successful";

    const text = `
Hello ${name},

Your transaction has been completed successfully.

Transaction Details:
--------------------------------
Amount: ₹${amount}
Transferred To: ${toAccount}
Status: Successful
--------------------------------

Thank you for using Backend Ledger.

Best Regards,
Backend Ledger Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Transaction Successful</title>
</head>

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f4f4f4;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);">

<tr>
<td style="background:#16a34a;padding:30px;text-align:center;color:white;">
<h1 style="margin:0;">Backend Ledger</h1>
<p style="margin-top:8px;">Transaction Successful</p>
</td>
</tr>

<tr>
<td style="padding:35px;">

<h2>Hello ${name},</h2>

<p>
Your transaction has been completed successfully.
</p>

<table width="100%" cellpadding="12" cellspacing="0" style="border:1px solid #dddddd;border-collapse:collapse;margin:25px 0;">

<tr style="background:#f8f8f8;">
<td><strong>Amount</strong></td>
<td>₹${amount}</td>
</tr>

<tr>
<td><strong>Transferred To</strong></td>
<td>${toAccount}</td>
</tr>

<tr style="background:#f8f8f8;">
<td><strong>Status</strong></td>
<td style="color:#16a34a;font-weight:bold;">Successful</td>
</tr>

</table>

<p>
If you did not authorize this transaction, please contact our support team immediately.
</p>

<p>
Thank you for choosing <strong>Backend Ledger</strong>.
</p>

<p>
Best Regards,<br>
<strong>Backend Ledger Team</strong>
</p>

</td>
</tr>

<tr>
<td style="background:#f5f5f5;padding:18px;text-align:center;font-size:13px;color:#777;">
© 2026 Backend Ledger. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount, reason) {
    const subject = "Transaction Failed";

    const text = `
Hello ${name},

Unfortunately, your transaction could not be completed.

Transaction Details:
--------------------------------
Amount: ₹${amount}
Recipient Account: ${toAccount}
Status: Failed
Reason: ${reason}
--------------------------------

No amount has been deducted from your account. If the issue persists, please contact our support team.

Best Regards,
Backend Ledger Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Transaction Failed</title>
</head>

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f4f4f4;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);">

<tr>
<td style="background:#dc2626;padding:30px;text-align:center;color:#ffffff;">
<h1 style="margin:0;">Backend Ledger</h1>
<p style="margin-top:8px;">Transaction Failed</p>
</td>
</tr>

<tr>
<td style="padding:35px;">

<h2>Hello ${name},</h2>

<p>
We regret to inform you that your recent transaction could not be processed.
</p>

<table width="100%" cellpadding="12" cellspacing="0" style="border:1px solid #dddddd;border-collapse:collapse;margin:25px 0;">

<tr style="background:#f8f8f8;">
<td><strong>Amount</strong></td>
<td>₹${amount}</td>
</tr>

<tr>
<td><strong>Recipient Account</strong></td>
<td>${toAccount}</td>
</tr>

<tr style="background:#f8f8f8;">
<td><strong>Status</strong></td>
<td style="color:#dc2626;font-weight:bold;">Failed</td>
</tr>

<tr>
<td><strong>Reason</strong></td>
<td>${reason}</td>
</tr>

</table>

<p>
No funds have been transferred. Please verify the transaction details and try again.
</p>

<p>
If you continue to experience issues, contact our support team for assistance.
</p>

<p>
Thank you for using <strong>Backend Ledger</strong>.
</p>

<p>
Best Regards,<br>
<strong>Backend Ledger Team</strong>
</p>

</td>
</tr>

<tr>
<td style="background:#f5f5f5;padding:18px;text-align:center;font-size:13px;color:#777;">
© 2026 Backend Ledger. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};