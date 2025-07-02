// src/app/about/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/logo";
import { Users, Zap, Brain, Heart, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="w-full py-8 sm:py-12 px-2 sm:px-4">
      <Card className="w-full sm:max-w-2xl md:max-w-4xl mx-auto shadow-xl border-t-4 border-primary overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6 sm:p-8 md:p-12">
          <div className="mx-auto mb-4 sm:mb-6 transform transition-transform hover:scale-110">
            <Logo className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 text-primary" />
          </div>
          <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
            About nyro
          </CardTitle>
          <CardDescription className="text-base sm:text-lg md:text-xl text-muted-foreground mt-2 sm:mt-3 max-w-2xl mx-auto leading-relaxed">
            Empowering every child&apos;s learning journey through personalized, AI-driven education.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 md:p-8 space-y-8 sm:space-y-12">
          <section className="space-y-4 sm:space-y-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-primary text-center">Our Story</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="space-y-4 sm:space-y-6">
                <p className="text-base sm:text-lg text-foreground leading-relaxed">
                  nyro was born from a simple yet powerful belief: every child deserves the opportunity to learn in a way that works for them. 
                  We understand that traditional educational approaches don&apos;t always meet the unique needs of children with learning difficulties.
                </p>
                <p className="text-base sm:text-lg text-foreground leading-relaxed">
                  Our platform combines cutting-edge AI technology with proven educational principles to create personalized learning experiences 
                  that adapt to each child&apos;s strengths, challenges, and interests.
                </p>
              </div>
              <div className="relative aspect-video w-full max-w-lg mx-auto">
                <Image 
                  src="https://picsum.photos/seed/about-story/600/400" 
                  alt="Children learning together" 
                  fill
                  className="rounded-lg object-cover shadow-lg"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl sm:text-2xl font-semibold text-primary mb-4 sm:mb-6 text-center flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 sm:h-7 sm:w-7" /> Why nyro?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <FeatureItem
                icon={<Brain className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
                title="Personalized Learning Paths"
                description="Lessons are not one-size-fits-all. They are uniquely generated based on each child's profile, adapting to their strengths and areas needing support."
              />
              <FeatureItem
                icon={<Users className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
                title="Addressing Learning Difficulties"
                description="Specifically designed to support children with various learning challenges by simplifying content and using tailored teaching approaches."
              />
              <FeatureItem
                icon={<ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
                title="Curriculum Aligned"
                description="Content is aligned with specified curricula, ensuring that learning is relevant and supports formal education goals."
              />
               <FeatureItem
                icon={<Zap className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
                title="Engaging Content"
                description="AI-generated images and mood-sensitive tone make lessons more interactive and enjoyable for children."
              />
               <FeatureItem
                icon={<Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
                title="Adaptive Quizzes"
                description="Assessments with explanations help reinforce learning and identify areas for further review, with options to re-learn."
              />
              <FeatureItem
                icon={<Heart className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
                title="Parent Involvement"
                description="Comprehensive progress tracking and insights help parents stay informed and support their child's learning journey."
              />
            </div>
          </section>

          <section className="space-y-4 sm:space-y-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-primary text-center">Our Commitment</h3>
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 sm:p-8 text-center">
              <p className="text-base sm:text-lg text-foreground leading-relaxed max-w-3xl mx-auto">
                We are committed to creating an inclusive learning environment where every child can thrive. 
                Our AI-powered platform continuously evolves to better serve the diverse needs of learners, 
                ensuring that no child is left behind in their educational journey.
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-4 sm:p-6 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="mx-auto mb-3 sm:mb-4 w-fit">
        {icon}
      </div>
      <h4 className="text-lg sm:text-xl font-semibold text-primary mb-2 sm:mb-3">{title}</h4>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
