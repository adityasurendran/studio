// src/app/about/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/logo";
import { Users, Zap, Brain, Heart, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="w-full max-w-screen-xl mx-auto py-12 px-4">
      <Card className="shadow-xl border-t-4 border-primary overflow-hidden w-full">
        <CardHeader className="text-center bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8 md:p-12">
          <div className="mx-auto mb-6 transform transition-transform hover:scale-110">
            <Logo className="h-32 w-32 md:h-40 md:w-40 text-primary" />
          </div>
          <CardTitle className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
            About Shannon
          </CardTitle>
          <CardDescription className="text-lg md:text-xl text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
            Empowering every child&apos;s learning journey through personalized, AI-driven education.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-10 md:px-10 md:py-16 space-y-12">
          <section className="text-center">
            <h2 className="text-3xl font-semibold text-accent mb-6 flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8" /> Our Mission
            </h2>
            <p className="text-lg text-foreground leading-relaxed max-w-3xl mx-auto">
              At Shannon, we believe that every child, regardless of their learning style or challenges, deserves access to high-quality, engaging, and personalized education. Our mission is to bridge learning gaps and foster a love for knowledge by leveraging the power of artificial intelligence to create unique learning experiences tailored to each child&apos;s individual needs, interests, and pace. We are committed to making learning accessible, fun, and effective.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
            <div>
              <h3 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <Zap className="h-7 w-7" /> What We Do
              </h3>
              <p className="text-foreground leading-relaxed mb-4">
                Shannon utilizes cutting-edge AI to generate interactive lessons that adapt to your child. Parents can create detailed profiles outlining their child&apos;s age, curriculum (e.g., CBSE, US Grade Level, Irish Junior Cycle), specific learning difficulties, interests, and even their recent mood.
              </p>
              <p className="text-foreground leading-relaxed">
                Our AI then crafts lessons with age-appropriate content, explanations suited for various learning styles (visual, auditory, reading/writing, kinesthetic), and images designed to enhance understanding—all while ensuring the material aligns with the specified educational framework.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl border-2 border-accent/30">
              <Image
                src="https://picsum.photos/seed/about-shannon-platform/600/400"
                alt="Shannon platform in use"
                width={600}
                height={400}
                className="object-cover w-full"
                data-ai-hint="education technology app"
              />
            </div>
          </div>

          <section>
            <h3 className="text-2xl font-semibold text-primary mb-6 text-center flex items-center justify-center gap-2">
              <Heart className="h-7 w-7" /> Why Shannon?
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureItem
                icon={<Brain className="h-10 w-10 text-accent" />}
                title="Personalized Learning Paths"
                description="Lessons are not one-size-fits-all. They are uniquely generated based on each child's profile, adapting to their strengths and areas needing support."
              />
              <FeatureItem
                icon={<Users className="h-10 w-10 text-accent" />}
                title="Addressing Learning Difficulties"
                description="Specifically designed to support children with various learning challenges by simplifying content and using tailored teaching approaches."
              />
              <FeatureItem
                icon={<ShieldCheck className="h-10 w-10 text-accent" />}
                title="Curriculum Aligned"
                description="Content is aligned with specified curricula, ensuring that learning is relevant and supports formal education goals."
              />
               <FeatureItem
                icon={<Zap className="h-10 w-10 text-accent" />}
                title="Engaging Content"
                description="AI-generated images and mood-sensitive tone make lessons more interactive and enjoyable for children."
              />
               <FeatureItem
                icon={<Sparkles className="h-10 w-10 text-accent" />}
                title="Adaptive Quizzes"
                description="Assessments with explanations help reinforce learning and identify areas for further review, with options to re-learn."
              />
               <FeatureItem
                icon={<Heart className="h-10 w-10 text-accent" />}
                title="Parent Partnership"
                description="Parents are integral, managing profiles, tracking progress, and providing insights that shape the learning experience."
              />
            </div>
          </section>
          
          <section className="text-center mt-12">
             <h2 className="text-3xl font-semibold text-accent mb-6">
                Join Us on This Journey
            </h2>
            <p className="text-lg text-foreground leading-relaxed max-w-3xl mx-auto">
                Shannon is more than just an app; it&apos;s a commitment to unlocking every child&apos;s potential. We are constantly evolving and improving, driven by feedback from parents and educators like you. Together, let&apos;s make learning an exciting and rewarding adventure for every child.
            </p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <Card className="p-6 text-center bg-card hover:shadow-lg transition-shadow h-full flex flex-col items-center border-secondary">
        <div className="p-3 bg-accent/10 rounded-full mb-4 w-fit">
            {icon}
        </div>
        <h4 className="text-xl font-semibold text-primary mb-2">{title}</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </Card>
  );
}
