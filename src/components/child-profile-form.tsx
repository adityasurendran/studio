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
import { Save, XCircle, Image as ImageIcon, Users, Type, Smile, ToyBrick, BarChartHorizontalBig, Languages, Clock } from 'lucide-react'; // Changed FontSize to Type
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().int().min(2, { message: "Age must be at least 2." }).max(18, { message: "Age must be 18 or younger." }),
  learningDifficulties: z.string().optional(),
  screenIssues: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system', 'colorful', 'simple']),
  language: z.string().min(2, { message: "Language selection is required." }),
  curriculum: z.string().min(3, { message: "Curriculum details required." }),
  interests: z.string().optional(),
  avatarSeed: z.string().optional().describe("A word or phrase to generate a unique avatar. Leave blank to use name."),
  learningStyle: z.enum(['visual', 'auditory', 'reading_writing', 'kinesthetic', 'balanced_mixed']).optional(),
  fontSizePreference: z.enum(['small', 'medium', 'large']).optional(),
  preferredActivities: z.string().optional().describe("Comma-separated list of preferred activity types."),
  recentMood: z.string().optional(),
  lessonHistory: z.string().optional(),
  enableLeaderboard: z.boolean().optional(),
  dailyUsageLimitMinutes: z.coerce.number().int().min(0).optional().nullable(),
  weeklyUsageLimitMinutes: z.coerce.number().int().min(0).optional().nullable(),
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
      language: profile?.language || 'en',
      curriculum: profile?.curriculum || '',
      interests: profile?.interests || '',
      avatarSeed: profile?.avatarSeed || '',
      learningStyle: profile?.learningStyle || 'balanced_mixed',
      fontSizePreference: profile?.fontSizePreference || 'medium',
      preferredActivities: profile?.preferredActivities || '',
      recentMood: profile?.recentMood || 'neutral',
      lessonHistory: profile?.lessonHistory || '',
      enableLeaderboard: profile?.enableLeaderboard || false,
      dailyUsageLimitMinutes: profile?.dailyUsageLimitMinutes || undefined,
      weeklyUsageLimitMinutes: profile?.weeklyUsageLimitMinutes || undefined,
    },
  });

  const handleFormSubmit: SubmitHandler<ProfileFormData> = (data) => {
    const processedData = {
      ...data,
      dailyUsageLimitMinutes: data.dailyUsageLimitMinutes === undefined || data.dailyUsageLimitMinutes === null || (typeof data.dailyUsageLimitMinutes === 'string' && data.dailyUsageLimitMinutes.trim() === '') ? undefined : Number(data.dailyUsageLimitMinutes),
      weeklyUsageLimitMinutes: data.weeklyUsageLimitMinutes === undefined || data.weeklyUsageLimitMinutes === null || (typeof data.weeklyUsageLimitMinutes === 'string' && data.weeklyUsageLimitMinutes.trim() === '') ? undefined : Number(data.weeklyUsageLimitMinutes),
    };
    onSubmit(processedData);
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
                    <div className="space-y-3">
                      <Input placeholder="e.g., happy bear, blue star, child's name" {...field} />
                      {/* Avatar Preview */}
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage 
                            src={`https://avatar.vercel.sh/${encodeURIComponent((field.value?.trim() || form.getValues('name') || 'preview').toLowerCase())}.png?size=48`} 
                            alt="Avatar preview" 
                          />
                          <AvatarFallback className="text-lg">
                            {(field.value?.trim() || form.getValues('name') || 'P')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">Avatar Preview</p>
                          <p className="text-xs">Based on: "{field.value?.trim() || form.getValues('name') || 'child name'}"</p>
                        </div>
                      </div>
                    </div>
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
                      <SelectItem value="kinesthetic">Kinesthetic (learns by doing and moving)</SelectItem>
                      <SelectItem value="balanced_mixed">Balanced / Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How does the child learn best? Kinesthetic learners benefit from hands-on activities, movement, and physical interaction. This helps in tailoring lesson delivery and generating appropriate activities.
                  </FormDescription>
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
                    <Textarea placeholder="e.g., Building blocks, Experiments, Movement games, Role-play, Crafts, Cooking, Gardening, Sports, Dance, Hands-on projects" {...field} />
                  </FormControl>
                  <FormDescription>
                    List types of activities the child enjoys. For kinesthetic learners, consider: building, experiments, movement, role-play, crafts, cooking, gardening, sports, dance, hands-on projects, manipulatives, physical games, construction, drama, or interactive activities.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="fontSizePreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Type className="h-4 w-4 text-muted-foreground" /> Font Size Preference</FormLabel> {/* Changed FontSize to Type */}
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
              name="dailyUsageLimitMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-muted-foreground" /> Daily Usage Limit (Minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 60 (for 1 hour)" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormDescription>Set a daily time limit for app usage in minutes (e.g., 30, 60). Leave blank for no limit.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weeklyUsageLimitMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-muted-foreground" /> Weekly Usage Limit (Minutes)</FormLabel>
                  <FormControl>
                     <Input type="number" placeholder="e.g., 300 (for 5 hours)" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormDescription>Set a weekly time limit for app usage in minutes. Leave blank for no limit.</FormDescription>
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
        </Form>
      </CardContent>
    </Card>
  );
}

