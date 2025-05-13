// src/components/custom-lesson-creator-form.tsx
"use client";

import type { ChildProfile, GeneratedLesson, LessonPage, QuizQuestion } from '@/types';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import { FileEdit, PlusCircle, Trash2, Save, BookOpen, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CustomLessonPageSchema = z.object({
  text: z.string().min(1, "Page content cannot be empty."),
});

const CustomQuizQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text cannot be empty."),
  options: z.array(z.string().min(1, "Option cannot be empty.")).length(4, "Please provide 4 options."),
  correctAnswerIndex: z.coerce.number().min(0).max(3, "Correct answer index must be between 0 and 3."),
  explanation: z.string().min(1, "Explanation cannot be empty."),
});

const CustomLessonSchema = z.object({
  lessonTitle: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title cannot exceed 100 characters."),
  subject: z.string().min(2, "Subject must be at least 2 characters.").max(50, "Subject cannot exceed 50 characters."),
  lessonPages: z.array(CustomLessonPageSchema).min(1, "A lesson must have at least one page."),
  quiz: z.array(CustomQuizQuestionSchema).min(0).optional(),
});

type CustomLessonFormData = z.infer<typeof CustomLessonSchema>;

interface CustomLessonCreatorFormProps {
  childProfile: ChildProfile;
}

export default function CustomLessonCreatorForm({ childProfile }: CustomLessonCreatorFormProps) {
  const form = useForm<CustomLessonFormData>({
    resolver: zodResolver(CustomLessonSchema),
    defaultValues: {
      lessonTitle: '',
      subject: '',
      lessonPages: [{ text: '' }],
      quiz: [],
    },
  });

  const { fields: pageFields, append: appendPage, remove: removePage } = useFieldArray({
    control: form.control,
    name: "lessonPages",
  });

  const { fields: quizFields, append: appendQuiz, remove: removeQuiz } = useFieldArray({
    control: form.control,
    name: "quiz",
  });

  const { toast } = useToast();
  const { addSavedLesson } = useChildProfilesContext();
  const router = useRouter();

  const handleFormSubmit: SubmitHandler<CustomLessonFormData> = (data) => {
    const customLesson: GeneratedLesson = {
      lessonTitle: data.lessonTitle,
      subject: data.subject,
      lessonFormat: "Custom Text-Based Lesson", // Hardcoded format for custom lessons
      lessonPages: data.lessonPages.map(page => ({
        sentences: page.text.split('\n').filter(s => s.trim() !== ''), // Split textarea content by lines for sentences
        imageDataUri: null, // No images for custom text-based lessons
      })),
      quiz: data.quiz ? data.quiz.map(q => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
      })) : [],
    };

    addSavedLesson(childProfile.id, customLesson);
    toast({
      title: "Custom Lesson Saved!",
      description: `"${data.lessonTitle}" has been added to ${childProfile.name}'s lessons.`,
    });
    form.reset();
    router.push('/dashboard/lessons'); // Navigate to lesson history or other relevant page
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl border-t-4 border-accent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileEdit className="h-10 w-10 text-accent" />
          <div>
            <CardTitle className="text-3xl font-bold text-accent">Create Custom Lesson</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-1">
              Design a unique lesson for <strong className="text-primary">{childProfile.name}</strong>.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            {/* Lesson Info Section */}
            <Card className="bg-card/50 border-secondary">
              <CardHeader><CardTitle className="text-xl text-primary flex items-center gap-2"><BookOpen/> Lesson Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="lessonTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Title</FormLabel>
                      <FormControl><Input placeholder="e.g., My Amazing Story About Dogs" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl><Input placeholder="e.g., Reading, Fun Facts, Science" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Lesson Pages Section */}
            <Card className="bg-card/50 border-secondary">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl text-primary flex items-center gap-2"><BookOpen/> Lesson Pages</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendPage({ text: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Page
                    </Button>
                </div>
                <CardDescription>Add content for each page of the lesson. Each line in the textbox will be treated as a new sentence or paragraph on the page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pageFields.map((field, index) => (
                  <Card key={field.id} className="p-4 border-dashed">
                    <FormField
                      control={form.control}
                      name={`lessonPages.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel>Page {index + 1} Content</FormLabel>
                            {pageFields.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removePage(index)} className="text-destructive hover:text-destructive/80">
                                <Trash2 className="mr-1 h-4 w-4" /> Remove Page
                              </Button>
                            )}
                          </div>
                          <FormControl><Textarea placeholder="Enter sentences for this page. Each new line will be a new paragraph." {...field} rows={5} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>
                ))}
                {pageFields.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Click 'Add Page' to start creating lesson content.</p>}
              </CardContent>
            </Card>

            {/* Quiz Section */}
            <Card className="bg-card/50 border-secondary">
              <CardHeader>
                 <div className="flex justify-between items-center">
                    <CardTitle className="text-xl text-primary flex items-center gap-2"><Brain/> Quiz Questions (Optional)</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendQuiz({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                    </Button>
                </div>
                 <CardDescription>Create a quiz to test understanding. Provide 4 options for each question.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {quizFields.map((field, index) => (
                  <Card key={field.id} className="p-4 border-dashed space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-md">Question {index + 1}</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeQuiz(index)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="mr-1 h-4 w-4" /> Remove Question
                        </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`quiz.${index}.questionText`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl><Textarea placeholder="e.g., What color is the sky?" {...field} rows={2} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([0, 1, 2, 3] as const).map((optIndex) => (
                      <FormField
                        key={optIndex}
                        control={form.control}
                        name={`quiz.${index}.options.${optIndex}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option {optIndex + 1}</FormLabel>
                            <FormControl><Input placeholder={`Option ${optIndex + 1}`} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    </div>
                     <FormField
                      control={form.control}
                      name={`quiz.${index}.correctAnswerIndex`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correct Answer</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="0">Option 1</SelectItem>
                              <SelectItem value="1">Option 2</SelectItem>
                              <SelectItem value="2">Option 3</SelectItem>
                              <SelectItem value="3">Option 4</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`quiz.${index}.explanation`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Explanation for Correct Answer</FormLabel>
                          <FormControl><Textarea placeholder="e.g., The sky is blue because of how light scatters." {...field} rows={2}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>
                ))}
                 {quizFields.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No quiz questions added. The lesson will not have a quiz.</p>}
              </CardContent>
            </Card>
            
            <div className="flex justify-end pt-6">
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 px-8 shadow-md hover:shadow-lg" size="lg">
                <Save className="mr-2 h-5 w-5" /> Save Custom Lesson
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
