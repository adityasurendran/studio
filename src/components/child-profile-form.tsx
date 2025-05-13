// src/components/child-profile-form.tsx
"use client";

import type { ChildProfile } from '@/types';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Save, XCircle, Image as ImageIcon, Users, FontSize, Smile, ToyBrick, BarChartHorizontalBig, Languages } from 'lucide-react'; // Added ToyBrick for activities, Languages icon

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().int().min(2, { message: "Age must be at least 2." }).max(18, { message: "Age must be 18 or younger." }),
  learningDifficulties: z.string().optional(),
  screenIssues: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system', 'colorful', 'simple']),
  language: z.string().min(2, { message: "Language selection is required." }), // Default to 'en'
  curriculum: z.string().min(3, { message: "Curriculum details required." }),
  interests: z.string().optional(),
  avatarSeed: z.string().optional().describe("A word or phrase to generate a unique avatar. Leave blank to use name."),
  learningStyle: z.enum(['visual', 'auditory', 'reading_writing', 'kinesthetic', 'balanced_mixed']).optional(),
  fontSizePreference: z.enum(['small', 'medium', 'large']).optional(),
  preferredActivities: z.string().optional().describe("Comma-separated list of preferred activity types."),
  recentMood: z.string().optional(), 
  lessonHistory: z.string().optional(),
  enableLeaderboard: z.boolean().optional(),
});

type ProfileFormData = Omit<ChildProfile, 'id' | 'lessonAttempts' | 'savedLessons' | 'points' | 'badges'>;

interface ChildProfileFormProps {
  profile?: ChildProfile; 
  onSubmit: (data: ProfileFormData) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export default function ChildProfileForm({ profile, onSubmit, onCancel, isEditing = false }: ChildProfileFormProps) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      age: profile?.age || 0,
      learningDifficulties: profile?.learningDifficulties || '',
      screenIssues: profile?.screenIssues || '',
      theme: profile?.theme || 'system',
      language: profile?.language || 'en', // Default to English
      curriculum: profile?.curriculum || '',
      interests: profile?.interests || '',
      avatarSeed: profile?.avatarSeed || '',
      learningStyle: profile?.learningStyle || 'balanced_mixed',
      fontSizePreference: profile?.fontSizePreference || 'medium',
      preferredActivities: profile?.preferredActivities || '',
      recentMood: profile?.recentMood || 'neutral',
      lessonHistory: profile?.lessonHistory || '',
      enableLeaderboard: profile?.enableLeaderboard || false,
    },
  });

  const handleFormSubmit: SubmitHandler<ProfileFormData> = (data) => {
    onSubmit(data);
    if (!isEditing) { 
      form.reset();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-t-4 border-primary">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">{isEditing ? 'Edit Child Profile' : 'Create New Child Profile'}</CardTitle>
        <CardDescription>{isEditing ? 'Update the details for this profile.' : 'Fill in the details to create a new child profile.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child&apos;s Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Alex Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 7" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="avatarSeed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4 text-muted-foreground" /> Avatar Customization</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., happy bear, blue star, child's name" {...field} />
                  </FormControl>
                  <FormDescription>Enter a word or short phrase to create a unique avatar. If left blank, the child&apos;s name will be used.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Languages className="h-4 w-4 text-muted-foreground" />Lesson Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language for lessons" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español (Spanish)</SelectItem>
                      <SelectItem value="fr">Français (French)</SelectItem>
                      <SelectItem value="de">Deutsch (German)</SelectItem>
                      <SelectItem value="it">Italiano (Italian)</SelectItem>
                      <SelectItem value="pt">Português (Portuguese)</SelectItem>
                      <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                      {/* Add more languages as needed */}
                    </SelectContent>
                  </Select>
                  <FormDescription>Primary language for lesson content and text-to-speech.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="learningDifficulties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Difficulties (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Dyslexia, ADHD, difficulty with numbers" {...field} />
                  </FormControl>
                  <FormDescription>Describe any specific challenges. This helps tailor lessons.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Dinosaurs, space, drawing, animals, music" {...field} />
                  </FormControl>
                  <FormDescription>List some of the child&apos;s interests to help personalize lessons.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="learningStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Users className="h-4 w-4 text-muted-foreground" /> Preferred Learning Style</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'balanced_mixed'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a learning style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="visual">Visual (learns by seeing)</SelectItem>
                      <SelectItem value="auditory">Auditory (learns by hearing)</SelectItem>
                      <SelectItem value="reading_writing">Reading/Writing (learns by reading and writing)</SelectItem>
                      <SelectItem value="kinesthetic">Kinesthetic (learns by doing)</SelectItem>
                      <SelectItem value="balanced_mixed">Balanced / Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>How does the child learn best? This helps in tailoring lesson delivery.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredActivities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><ToyBrick className="h-4 w-4 text-muted-foreground" /> Preferred Activities (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Interactive games, Storytelling, Drawing tasks, Building blocks, Experiments" {...field} />
                  </FormControl>
                  <FormDescription>List types of activities the child enjoys. This can help shape lesson format and suggestions.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="fontSizePreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><FontSize className="h-4 w-4 text-muted-foreground" /> Font Size Preference</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'medium'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred font size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose the font size for lesson content.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="recentMood"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><Smile className="h-4 w-4 text-muted-foreground" /> Default Recent Mood</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'neutral'}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select child's typical mood" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="happy">😊 Happy / Engaged</SelectItem>
                        <SelectItem value="neutral">😐 Neutral / Calm</SelectItem>
                        <SelectItem value="sad">😞 Sad / Tired / Unfocused</SelectItem>
                        <SelectItem value="anxious">😟 Anxious / Stressed</SelectItem>
                        <SelectItem value="excited">🤩 Excited / Eager</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>Set a default mood. This can be updated before generating each lesson.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
              control={form.control}
              name="screenIssues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Display Preferences (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Sensitive to bright colors, prefers specific contrasts" {...field} />
                  </FormControl>
                  <FormDescription>Any other preferences for on-screen presentation.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Theme</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="colorful">Colorful</SelectItem>
                      <SelectItem value="simple">Simple</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="curriculum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Curriculum Focus</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., US Grade 2 Math, UK Year 3 English, IB PYP Science, Basic Phonics" {...field} />
                  </FormControl>
                  <FormDescription>Specify the educational framework (e.g., US Grade 2 Math, UK Year 3 English, CBSE Grade 5 Science, IB PYP, general phonics). This helps the AI tailor content accurately.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lessonHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Lesson History / Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any relevant background, e.g., 'Completed basic phonics.' 'Knows numbers up to 20.'" {...field} />
                  </FormControl>
                  <FormDescription>This will be automatically updated as lessons are completed.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enableLeaderboard"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-secondary/20">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-1.5"><BarChartHorizontalBig className="h-4 w-4 text-muted-foreground" />Leaderboard Participation</FormLabel>
                    <FormDescription>
                      Allow this child&apos;s name and points to appear on leaderboards?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-3 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} size="lg">
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
              )}
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Save Changes' : 'Create Profile'}
              </Button>
            </div>
          </form>
        