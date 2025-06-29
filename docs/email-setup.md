# Email Setup Guide for Shannon Learning App

This guide explains how to set up the weekly progress email functionality for the Shannon Learning App.

## Overview

The app sends weekly progress reports to parents via email, including:
- Lesson completion statistics
- Quiz scores and performance
- Points earned
- Recent learning activity
- Personalized insights

## Email Configuration

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App Configuration
APP_BASE_URL=https://your-app-domain.com
```

### 2. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

### 3. Alternative Email Providers

You can use other SMTP providers by changing the configuration:

**Outlook/Hotmail:**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**Yahoo:**
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

**Custom SMTP Server:**
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

## Firebase Functions Setup

### 1. Install Dependencies

Navigate to the `functions` directory and install the new dependencies:

```bash
cd functions
npm install nodemailer handlebars
```

### 2. Deploy Functions

Deploy the updated functions to Firebase:

```bash
firebase deploy --only functions
```

### 3. Set Firebase Config (Optional)

For production, you can set configuration via Firebase CLI:

```bash
firebase functions:config:set smtp.host="smtp.gmail.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.user="your-email@gmail.com"
firebase functions:config:set smtp.pass="your-app-password"
firebase functions:config:set app.base_url="https://your-app-domain.com"
```

## Email Schedule

The weekly progress emails are automatically sent:
- **When**: Every Monday at 9:00 AM UTC
- **To**: All parents with child profiles
- **Condition**: Only if there's recent activity (last 7 days) or it's the first week

## Testing

### 1. Manual Test

Use the Email Testing Panel in Parent Settings:
1. Go to Dashboard → Parent Settings
2. Scroll to the "Email Testing Panel" section
3. Click "Send Test Email" for any child profile
4. Check your email inbox

### 2. Function Testing

Test the Firebase function directly:

```javascript
// In browser console or your app
const { sendWeeklyProgressEmailViaFunction } = await import('/src/lib/progress-email.js');
const result = await sendWeeklyProgressEmailViaFunction('child-profile-id');
console.log(result);
```

### 3. Local Testing

For local development, you can test the email service:

```bash
cd functions
npm run serve
```

Then call the function via the Firebase emulator.

## Email Template

The email template is located at `functions/email-templates/weekly-progress.hbs` and includes:

- **Header**: Shannon branding and child information
- **Statistics**: Lessons completed, points earned, average score, subjects covered
- **Recent Lessons**: Last 5 lessons with scores and timestamps
- **Footer**: Links to dashboard and unsubscribe

### Customizing the Template

1. Edit `functions/email-templates/weekly-progress.hbs`
2. Modify the HTML and CSS as needed
3. Redeploy functions: `firebase deploy --only functions`

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check SMTP credentials
   - Ensure 2FA is enabled for Gmail
   - Verify app password is correct

2. **Emails Not Sending**
   - Check Firebase function logs: `firebase functions:log`
   - Verify email configuration
   - Check if child profiles have lesson attempts

3. **Template Not Loading**
   - Ensure `email-templates` directory exists in functions
   - Check file permissions
   - Verify Handlebars syntax

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will show detailed SMTP communication in the function logs.

## Security Considerations

1. **App Passwords**: Use app-specific passwords, not your main password
2. **Environment Variables**: Never commit email credentials to version control
3. **Rate Limiting**: The function includes basic rate limiting to prevent abuse
4. **Unsubscribe**: All emails include unsubscribe links

## Monitoring

Monitor email delivery through:
- Firebase Function logs
- Email provider analytics
- User feedback and engagement metrics

## Future Enhancements

Potential improvements:
- Email preferences per child
- Customizable email frequency
- Rich media content (images, videos)
- Integration with external email services (SendGrid, Mailgun)
- A/B testing for email templates 