import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, ShieldCheck } from "lucide-react";
import Logo from "@/components/logo"; 

export default function HomePage() {
  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 py-12 flex flex-col items-center text-center">
      <div className="mb-8">
        <Logo className="h-20 w-20 sm:h-24 sm:w-24 text-primary animate-pulse" />
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-primary tracking-tight">
        Welcome to Shannon!
      </h1>
      <p className="text-lg sm:text-xl text-foreground mb-12 max-w-3xl leading-relaxed">
        Your dedicated partner in empowering children with learning difficulties through <span className="text-accent font-semibold">personalized</span> and <span className="text-accent font-semibold">engaging</span> AI-driven lessons.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-16"> 
        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group border border-transparent hover:border-primary/30 rounded-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/10 via-card to-card pb-4">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-accent mx-auto mb-3"/>
            <CardTitle className="text-2xl md:text-3xl font-semibold text-primary group-hover:text-accent transition-colors">For Parents</CardTitle>
            <CardDescription className="text-sm md:text-base">Manage profiles, track progress, and support your child&apos;s unique learning journey.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Image 
              src="https://picsum.photos/seed/parent-dashboard/600/400" 
              alt="Parent Dashboard Preview" 
              width={600} // Increased placeholder width for better quality on larger cards
              height={375} // Increased placeholder height
              className="rounded-md mb-6 w-full object-cover shadow-lg border-2 border-muted group-hover:border-accent/50 transition-all"
              data-ai-hint="parent child computer"
            />
            <Link href="/signin" passHref>
              <Button className="w-full text-base md:text-lg py-3 md:py-6 bg-primary text-primary-foreground hover:bg-primary/90 group-hover:bg-accent group-hover:text-accent-foreground transition-colors shadow-md hover:shadow-lg" size="lg">
                Parent Sign In <ArrowRight className="ml-2 h-5 w-5"/>
              </Button>
            </Link>
            <p className="text-sm mt-4 text-muted-foreground">
              New here? <Link href="/signup" className="font-medium text-primary hover:text-accent hover:underline">Create an account</Link>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group border border-transparent hover:border-accent/30 rounded-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-accent/10 via-card to-card pb-4">
            <ShieldCheck className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3"/>
            <CardTitle className="text-2xl md:text-3xl font-semibold text-accent group-hover:text-primary transition-colors">For Children</CardTitle>
            <CardDescription className="text-sm md:text-base">Explore fun lessons tailored just for you! (Parents, please sign in first).</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
             <Image 
              src="https://picsum.photos/seed/child-learning-fun/600/400" 
              alt="Child Learning Preview" 
              width={600} // Increased placeholder width
              height={375} // Increased placeholder height
              className="rounded-md mb-6 w-full object-cover shadow-lg border-2 border-muted group-hover:border-primary/50 transition-all"
              data-ai-hint="child learning fun"
            />
            <Link href="/dashboard" passHref>
              <Button className="w-full text-base md:text-lg py-3 md:py-6 bg-secondary text-secondary-foreground hover:bg-secondary/80 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-md hover:shadow-lg" size="lg">
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5"/>
              </Button>
            </Link>
             <p className="text-sm mt-4 text-muted-foreground">
              (Access enabled after parent sign-in & profile setup)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 p-8 bg-card rounded-xl shadow-2xl border-t-4 border-primary w-full max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">Our Mission</h2>
        <p className="text-lg text-foreground leading-relaxed">
          Shannon is dedicated to providing <span className="font-semibold">high-quality</span> educational resources for children facing learning challenges. We believe every child deserves the chance to learn, grow, and succeed at their own pace.
        </p>
      </div>
    </div>
  );
}
