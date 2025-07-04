// src/app/faq/page.tsx
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, BookOpen, Users, Zap, ShieldCheck, Brain, Palette } from "lucide-react";

const faqs = [
  {
    question: "What is nyro?",
    answer:
      "nyro is an AI-powered learning application designed to help children, especially those with learning difficulties, by providing personalized and engaging lessons. Our goal is to make quality education accessible to all.",
    icon: BookOpen,
  },
  {
    question: "Who is nyro for?",
    answer:
      "nyro is primarily for children aged 2-18 who may benefit from tailored educational content. It's particularly helpful for children with learning difficulties, as lessons can be adapted to their specific needs, pace, and interests. Parents use the app to manage profiles and track progress.",
    icon: Users,
  },
  {
    question: "How are lessons generated?",
    answer:
      "Lessons are generated using advanced AI (Artificial Intelligence) models. Parents provide information about their child's age, curriculum focus, interests, learning difficulties, and recent mood. The AI then crafts a unique lesson, including text and images, specifically for that child. For image generation, we use models like Gemini 2.0 Flash.",
    icon: Zap,
  },
  {
    question: "How do I manage child profiles?",
    answer:
      "After signing in, parents can access the 'Child Profiles' section in the dashboard. From there, you can add new profiles, edit existing ones (update age, interests, curriculum, avatar, etc.), and set an active profile for lesson generation. Each child's lesson history and quiz attempts are stored with their profile.",
    icon: Users,
  },
  {
    question: "What kind of learning difficulties can nyro help with?",
    answer:
      "nyro aims to be adaptable. When creating or editing a child's profile, you can specify learning difficulties such as dyslexia, ADHD, challenges with specific subjects (like math or reading), or general learning pace. The AI will attempt to simplify explanations, use clearer language, and adjust content complexity based on this information.",
    icon: Brain,
  },
  {
    question: "Can I customize the look and feel of the lessons?",
    answer:
      "Yes, to some extent. In each child's profile, you can select a preferred theme (e.g., light, dark, colorful, simple) and mention any screen or display preferences (like 'prefers larger fonts'). The lesson display will try to honor these settings.",
    icon: Palette,
  },
];

export default function FAQPage() {
  return (
    <div className="w-full py-8 sm:py-12 px-2 sm:px-4">
      <Card className="w-full sm:max-w-2xl md:max-w-4xl mx-auto shadow-xl border-t-4 border-primary">
        <CardHeader className="text-center p-4 sm:p-6">
          <div className="mx-auto bg-primary/10 p-3 sm:p-4 rounded-full w-fit mb-3 sm:mb-4">
            <HelpCircle className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
            Frequently Asked Questions
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-muted-foreground mt-2">
            Find answers to common questions about nyro. If you don&apos;t see your question here, contact us.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 py-6 sm:py-8">
          <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="p-4 sm:p-6 text-base sm:text-lg font-semibold text-left hover:no-underline text-primary hover:text-accent focus:text-accent">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <faq.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary/80 flex-shrink-0" />
                    <span className="text-left">{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
