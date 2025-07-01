import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Brain, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  Target, 
  Heart, 
  Star,
  CheckCircle,
  Play,
  Zap,
  Award,
  TrendingUp,
  ChevronRight,
  Lightbulb,
  Globe,
  Clock,
  MessageCircle,
  Rocket
} from "lucide-react";
import Logo from "@/components/logo"; 

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 left-10 animate-float" style={{animationDelay: '1s'}}>
          <Brain className="h-8 w-8 text-primary/30" />
        </div>
        <div className="absolute top-40 right-20 animate-float" style={{animationDelay: '3s'}}>
          <Sparkles className="h-6 w-6 text-accent/30" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float" style={{animationDelay: '5s'}}>
          <Target className="h-7 w-7 text-primary/30" />
        </div>
        <div className="absolute bottom-20 right-10 animate-float" style={{animationDelay: '2s'}}>
          <Award className="h-6 w-6 text-accent/30" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Animated Logo */}
          <div className="flex justify-center mb-12 animate-slide-in-up">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse-glow"></div>
              <div className="relative bg-gradient-to-br from-card to-card/80 backdrop-blur-sm rounded-full p-6 shadow-2xl border border-primary/10 hover-lift">
                <Logo className="h-24 w-24 sm:h-32 sm:w-32 text-primary transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute -top-3 -right-3">
                  <Sparkles className="h-8 w-8 text-accent animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Headline */}
          <div className="mb-8 animate-slide-in-up" style={{animationDelay: '0.2s'}}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent mb-6 leading-tight animate-gradient-shift">
              AI-Powered
              <span className="block bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Learning
              </span>
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
              <span className="text-accent font-semibold">for Every Child</span>
              <div className="w-16 h-1 bg-gradient-to-r from-accent to-primary rounded-full"></div>
            </div>
          </div>
          
          {/* Subtitle */}
          <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground mb-12 max-w-5xl mx-auto leading-relaxed font-light animate-slide-in-up" style={{animationDelay: '0.4s'}}>
            Shannon creates <span className="text-primary font-semibold">personalized, engaging lessons</span> that adapt to your child's unique learning style, 
            making education <span className="text-accent font-semibold">accessible and enjoyable</span> for children with learning difficulties.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-slide-in-up" style={{animationDelay: '0.6s'}}>
            <Link href="/signup" passHref>
              <Button size="lg" className="group relative overflow-hidden text-xl px-10 py-8 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground shadow-2xl hover:shadow-accent/25 transform hover:scale-105 transition-all duration-300 border-0 btn-glow">
                <span className="relative z-10 flex items-center">
                  <Rocket className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                  Start Free Trial 
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>
            </Link>
            <Link href="/signin" passHref>
              <Button size="lg" variant="outline" className="text-xl px-10 py-8 border-2 border-primary/30 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 shadow-xl hover:shadow-primary/25 transform hover:scale-105">
                <span className="flex items-center">
                  Sign In 
                  <ChevronRight className="ml-3 h-6 w-6" />
                </span>
              </Button>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-slide-in-up" style={{animationDelay: '0.8s'}}>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/10 hover-lift">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/10 hover-lift">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/10 hover-lift">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>14-day free trial</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-card/30 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-slide-in-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 hover-lift">
              <Lightbulb className="h-4 w-4" />
              Why Parents Choose Shannon
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-8">
              Revolutionary Learning
              <span className="block text-accent">Experience</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Our AI-powered platform adapts to your child's unique needs, making learning engaging and effective.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Personalization",
                description: "Our AI creates lessons tailored to your child's learning style, interests, and pace.",
                color: "primary"
              },
              {
                icon: Target,
                title: "Learning Difficulties Support",
                description: "Specialized content and features designed for children with dyslexia, ADHD, and other challenges.",
                color: "accent"
              },
              {
                icon: TrendingUp,
                title: "Progress Tracking",
                description: "Detailed insights into your child's learning progress with weekly reports and achievements.",
                color: "primary"
              },
              {
                icon: Play,
                title: "Engaging Content",
                description: "Interactive lessons, quizzes, and activities that make learning fun and memorable.",
                color: "accent"
              },
              {
                icon: ShieldCheck,
                title: "Safe & Secure",
                description: "Child-safe environment with parental controls and secure data protection.",
                color: "primary"
              },
              {
                icon: Award,
                title: "Achievement System",
                description: "Gamified learning with badges, points, and leaderboards to motivate and celebrate progress.",
                color: "accent"
              }
            ].map((feature, index) => (
              <Card key={index} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm card-hover animate-slide-in-up" style={{animationDelay: `${0.1 * index}s`}}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="text-center pb-6 relative z-10">
                  <div className={`mx-auto w-16 h-16 bg-${feature.color}/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-${feature.color}/20 transition-all duration-500 group-hover:scale-110`}>
                    <feature.icon className={`h-8 w-8 text-${feature.color}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10">
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-slide-in-up">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6 hover-lift">
              <Clock className="h-4 w-4" />
              Get Started in Minutes
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-8">
              How Shannon
              <span className="block text-accent">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Get started in minutes and watch your child's learning journey begin.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Create Profile",
                description: "Set up your child's profile with their age, interests, and learning preferences.",
                color: "primary"
              },
              {
                step: "2",
                title: "AI Generates Lessons",
                description: "Our AI creates personalized lessons based on your child's profile and learning style.",
                color: "accent"
              },
              {
                step: "3",
                title: "Learn & Grow",
                description: "Your child engages with interactive content while you track their progress and achievements.",
                color: "primary"
              }
            ].map((step, index) => (
              <div key={index} className="text-center group animate-slide-in-up" style={{animationDelay: `${0.2 * index}s`}}>
                <div className={`relative mx-auto w-24 h-24 bg-${step.color}/10 rounded-full flex items-center justify-center mb-8 group-hover:bg-${step.color}/20 transition-all duration-500 group-hover:scale-110`}>
                  <span className={`text-3xl font-black text-${step.color}`}>{step.step}</span>
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-spin-slow"></div>
                </div>
                <h3 className="text-2xl font-bold text-primary mb-6 group-hover:text-accent transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-card/30 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-slide-in-up">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6 hover-lift">
              <Heart className="h-4 w-4" />
              Loved by Parents
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-8">
              What Parents
              <span className="block text-accent">Say</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "Shannon has transformed my daughter's learning experience. The personalized lessons have made such a difference in her confidence and progress.",
                author: "Sarah M.",
                role: "Parent of 8-year-old",
                icon: Heart,
                color: "primary"
              },
              {
                quote: "The AI adapts perfectly to my son's ADHD. He's more engaged than ever and actually looks forward to learning sessions.",
                author: "Michael R.",
                role: "Parent of 10-year-old",
                icon: Zap,
                color: "accent"
              },
              {
                quote: "Finally, an educational platform that understands my child's dyslexia. The progress tracking gives me peace of mind.",
                author: "Emma L.",
                role: "Parent of 7-year-old",
                icon: BookOpen,
                color: "primary"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm card-hover animate-slide-in-up" style={{animationDelay: `${0.1 * index}s`}}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 bg-${testimonial.color}/10 rounded-full flex items-center justify-center mr-4 group-hover:bg-${testimonial.color}/20 transition-all duration-300`}>
                      <testimonial.icon className={`h-6 w-6 text-${testimonial.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-primary">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12 animate-slide-in-up">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-8 animate-gradient-shift">
              Ready to Transform
              <span className="block">Your Child's Learning?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of parents who have discovered the power of personalized AI-driven education.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12 animate-slide-in-up" style={{animationDelay: '0.2s'}}>
            <Link href="/signup" passHref>
              <Button size="lg" className="group relative overflow-hidden text-xl px-12 py-8 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground shadow-2xl hover:shadow-accent/25 transform hover:scale-105 transition-all duration-300 border-0 btn-glow">
                <span className="relative z-10 flex items-center">
                  <Rocket className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                  Start Free Trial 
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>
            </Link>
            <Link href="/signin" passHref>
              <Button size="lg" variant="outline" className="text-xl px-12 py-8 border-2 border-primary/30 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 shadow-xl hover:shadow-primary/25 transform hover:scale-105">
                <span className="flex items-center">
                  Sign In to Dashboard
                  <ChevronRight className="ml-3 h-6 w-6" />
                </span>
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-slide-in-up" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/10 hover-lift">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/10 hover-lift">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/10 hover-lift">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/signup" passHref>
          <Button size="lg" className="rounded-full w-16 h-16 bg-gradient-to-r from-accent to-primary text-white shadow-2xl hover:shadow-accent/25 transform hover:scale-110 transition-all duration-300 animate-pulse-glow">
            <Rocket className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
