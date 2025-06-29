import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, ShieldCheck } from "lucide-react";
import Logo from "@/components/logo"; 

export default function HomePage() {
  return (
    <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 py-8 sm:py-12 flex flex-col items-center text-center">
      <div className="mb-6 sm:mb-8">
        <Logo className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-primary animate-pulse" />
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 text-primary tracking-tight px-2">
        Welcome to Shannon!
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-foreground mb-8 sm:mb-12 max-w-3xl leading-relaxed px-4">
        Your dedicated partner in empowering children with learning difficulties through <span className="text-accent font-semibold">personalized</span> and <span className="text-accent font-semibold">engaging</span> AI-driven lessons.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 w-full mb-12 sm:mb-16 px-2"> 
        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group border border-transparent hover:border-primary/30 rounded-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/10 via-card to-card pb-4 px-4 sm:px-6">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-accent mx-auto mb-3"/>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary group-hover:text-accent transition-colors">For Parents</CardTitle>
            <CardDescription className="text-sm sm:text-base">Manage profiles, track progress, and support your child&apos;s unique learning journey.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Image 
              src="https://picsum.photos/seed/parent-dashboard/600/400" 
              alt="Parent Dashboard Preview" 
              width={600}
              height={375}
              className="rounded-md mb-4 sm:mb-6 w-full object-cover shadow-lg border-2 border-muted group-hover:border-accent/50 transition-all"
              data-ai-hint="parent child computer"
            />
            <Link href="/signin" passHref>
              <Button className="w-full text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-6 bg-primary text-primary-foreground hover:bg-primary/90 group-hover:bg-accent group-hover:text-accent-foreground transition-colors shadow-md hover:shadow-lg" size="lg">
                Parent Sign In <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5"/>
              </Button>
            </Link>
            <p className="text-xs sm:text-sm mt-3 sm:mt-4 text-muted-foreground">
              New here? <Link href="/signup" className="font-medium text-primary hover:text-accent hover:underline">Create an account</Link>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group border border-transparent hover:border-accent/30 rounded-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-accent/10 via-card to-card pb-4 px-4 sm:px-6">
            <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary mx-auto mb-3"/>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-semibold text-accent group-hover:text-primary transition-colors">For Children</CardTitle>
            <CardDescription className="text-sm sm:text-base">Explore fun lessons tailored just for you! (Parents, please sign in first).</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
             <Image 
              src="https://picsum.photos/seed/child-learning-fun/600/400" 
              alt="Child Learning Preview" 
              width={600}
              height={375}
              className="rounded-md mb-4 sm:mb-6 w-full object-cover shadow-lg border-2 border-muted group-hover:border-primary/50 transition-all"
              data-ai-hint="child learning fun"
            />
            <Link href="/dashboard" passHref>
              <Button className="w-full text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-6 bg-secondary text-secondary-foreground hover:bg-secondary/80 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-md hover:shadow-lg" size="lg">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5"/>
              </Button>
            </Link>
             <p className="text-xs sm:text-sm mt-3 sm:mt-4 text-muted-foreground">
              (Access enabled after parent sign-in & profile setup)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 sm:mt-10 p-6 sm:p-8 bg-card rounded-xl shadow-2xl border-t-4 border-primary w-full max-w-5xl mx-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-3 sm:mb-4">Our Mission</h2>
        <p className="text-base sm:text-lg text-foreground leading-relaxed">
          Shannon is dedicated to providing <span className="font-semibold">high-quality</span> educational resources for children facing learning challenges. We believe every child deserves the chance to learn, grow, and succeed at their own pace.
        </p>
      </div>
    </div>
  );
}
