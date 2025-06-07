import type { LessonAttempt } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export function formatLessonHistorySummary(attempts?: LessonAttempt[]): string {
  if (!attempts || attempts.length === 0) {
    return 'No lesson history available yet.';
  }
  return attempts
    .slice(-5)
    .reverse()
    .map(attempt =>
      `Lesson: "${attempt.lessonTitle}" (Topic: ${attempt.lessonTopic || 'N/A'}, Subject: ${attempt.subject || 'N/A'})` +
      `${attempt.quizTotalQuestions > 0 ? `, Score: ${attempt.quizScore}% (${attempt.questionsAnsweredCorrectly}/${attempt.quizTotalQuestions} correct)` : ', No quiz'}` +
      `${attempt.pointsAwarded ? `, Points: +${attempt.pointsAwarded}` : ''}` +
      `, About ${formatDistanceToNow(new Date(attempt.timestamp), { addSuffix: true })}.` +
      `${attempt.choseToRelearn ? ' Chose to relearn.' : ''}`
    )
    .join('\n');
}
