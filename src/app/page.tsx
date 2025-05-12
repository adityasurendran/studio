import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center">
      <Image 
        src="https://picsum.photos/seed/shannonlogo/150/150" 
        alt="Shannon Logo" 
        width={150} 
        height={150} 
        className="rounded-full mb-6 shadow-lg"
        data-ai-hint="educational logo"
      />
      <h1 className="text-5xl font-bold mb-6 text-primary">
        Welcome to Shannon!
      </h1>
      <p className="text-xl text-foreground mb-10 max-w-2xl">
        Your partner in empowering children with learning difficulties through personalized and engaging lessons.
      </p>
      
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
        <Card className="shadow-xl hover:shadow-2xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl text-accent">For Parents</CardTitle>
            <CardDescription>Manage profiles, track progress, and support your child's learning journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image 
              src="https://picsum.photos/seed/parentdashboard/400/250" 
              alt="Parent Dashboard Preview" 
              width={400} 
              height={250} 
              className="rounded-md mb-4 w-full object-cover"
              data-ai-hint="parent child computer"
            />
            <Link href="/signin" passHref>
              <Button className="w-full" variant="default" size="lg">Parent Sign In</Button>
            </Link>
            <p className="text-sm mt-2 text-muted-foreground">
              New here? <Link href="/signup" className="text-primary hover:underline">Create an account</Link>
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-xl hover:shadow-2xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl text-accent">For Children</CardTitle>
            <CardDescription>Explore fun lessons tailored just for you and earn exciting rewards!</CardDescription>
          </CardHeader>
          <CardContent>
             <Image 
              src="https://picsum.photos/seed/childlearning/400/250" 
              alt="Child Learning Preview" 
              width={400} 
              height={250} 
              className="rounded-md mb-4 w-full object-cover"
              data-ai-hint="child learning fun"
            />
            <Link href="/dashboard" passHref>
              <Button className="w-full" variant="secondary" size="lg">Go to Dashboard</Button>
            </Link>
             <p className="text-sm mt-2 text-muted-foreground">
              (Parents, please sign in to access and set up child profiles)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 p-6 bg-card rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-primary mb-3">Our Mission</h2>
        <p className="text-foreground max-w-xl">
          Shannon is dedicated to providing 100% free, high-quality educational resources for children facing learning challenges. We believe every child deserves the chance to succeed.
        </p>
      </div>
    </div>
  );
}

