const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Load email templates
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, 'email-templates', `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  return handlebars.compile(templateSource);
};

// Helper function to get score class for styling
const getScoreClass = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  return 'poor';
};

// Helper function to format time ago
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const lessonDate = new Date(timestamp);
  const diffInHours = Math.floor((now - lessonDate) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }
};

// Send weekly progress email
const sendWeeklyProgressEmail = async (parentEmail, childProfile, lessonAttempts) => {
  try {
    // Calculate statistics
    const totalLessons = lessonAttempts.length;
    const totalPoints = lessonAttempts.reduce((sum, attempt) => sum + (attempt.pointsAwarded || 0), 0);
    
    const quizAttempts = lessonAttempts.filter(attempt => attempt.quizTotalQuestions > 0);
    const averageScore = quizAttempts.length > 0 
      ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.quizScore, 0) / quizAttempts.length)
      : 0;
    
    const subjects = [...new Set(lessonAttempts.map(attempt => attempt.subject))];
    const subjectsCount = subjects.length;

    // Get recent lessons (last 5)
    const recentLessons = lessonAttempts
      .slice(-5)
      .reverse()
      .map(attempt => ({
        lessonTitle: attempt.lessonTitle,
        subject: attempt.subject,
        lessonTopic: attempt.lessonTopic,
        quizScore: attempt.quizScore,
        quizTotalQuestions: attempt.quizTotalQuestions,
        questionsAnsweredCorrectly: attempt.questionsAnsweredCorrectly,
        pointsAwarded: attempt.pointsAwarded,
        timeAgo: formatTimeAgo(attempt.timestamp),
        scoreClass: getScoreClass(attempt.quizScore)
      }));

    // Prepare template data
    const templateData = {
      childName: childProfile.name,
      childAge: childProfile.age,
      childInterests: childProfile.interests || 'No specific interests listed',
      totalLessons,
      totalPoints,
      averageScore,
      subjectsCount,
      recentLessons,
      dashboardUrl: process.env.APP_BASE_URL + '/dashboard',
      unsubscribeUrl: process.env.APP_BASE_URL + '/unsubscribe?email=' + encodeURIComponent(parentEmail)
    };

    // Load and compile template
    const template = loadTemplate('weekly-progress');
    const htmlContent = template(templateData);

    // Send email
    const mailOptions = {
      from: `"Shannon Learning App" <${process.env.SMTP_USER}>`,
      to: parentEmail,
      subject: `Weekly Progress Report: ${childProfile.name}'s Learning Journey`,
      html: htmlContent,
      text: generateTextVersion(templateData) // Fallback text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Weekly progress email sent to ${parentEmail} for child ${childProfile.name}`);
    return result;

  } catch (error) {
    console.error('Error sending weekly progress email:', error);
    throw error;
  }
};

// Generate text version of the email
const generateTextVersion = (data) => {
  let text = `Weekly Progress Report for ${data.childName}\n\n`;
  text += `Age: ${data.childAge} | Interests: ${data.childInterests}\n\n`;
  text += `📊 Summary:\n`;
  text += `- Lessons Completed: ${data.totalLessons}\n`;
  text += `- Points Earned: ${data.totalPoints}\n`;
  text += `- Average Score: ${data.averageScore}%\n`;
  text += `- Subjects Covered: ${data.subjectsCount}\n\n`;
  
  if (data.recentLessons.length > 0) {
    text += `📚 Recent Lessons:\n`;
    data.recentLessons.forEach(lesson => {
      text += `- ${lesson.lessonTitle} (${lesson.subject})\n`;
      text += `  Topic: ${lesson.lessonTopic}\n`;
      if (lesson.quizTotalQuestions > 0) {
        text += `  Score: ${lesson.quizScore}% (${lesson.questionsAnsweredCorrectly}/${lesson.quizTotalQuestions} correct)\n`;
      }
      if (lesson.pointsAwarded) {
        text += `  Points: +${lesson.pointsAwarded}\n`;
      }
      text += `  ${lesson.timeAgo}\n\n`;
    });
  } else {
    text += `No lessons completed this week. Time to start learning! 🚀\n\n`;
  }
  
  text += `View your full dashboard: ${data.dashboardUrl}\n`;
  text += `Unsubscribe from emails: ${data.unsubscribeUrl}\n\n`;
  text += `Keep up the great work! 💪\n`;
  text += `© 2024 Shannon Learning App. All rights reserved.`;
  
  return text;
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendWeeklyProgressEmail,
  testEmailConfig
}; 