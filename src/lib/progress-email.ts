import type { ChildProfile } from '@/types';
import { formatLessonHistorySummary } from '@/lib/lesson-summary';

export function sendWeeklyProgressEmail(parentEmail: string, child: ChildProfile) {
  const summary = formatLessonHistorySummary(child.lessonAttempts);
  const message = `Weekly Progress for ${child.name}\n\n${summary}\n\nTotal Points: ${child.points}`;
  console.log(`Sending weekly progress email to ${parentEmail}:\n${message}`);
}
