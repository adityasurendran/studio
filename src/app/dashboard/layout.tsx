// src/app/dashboard/layout.tsx
"use client"; 

import AuthGuard from '@/components/auth-guard';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, PlusSquare, BookOpen, Settings, LogOut, Palette, Sparkles, Brain, History, Search, Trophy, FastForward } from 'lucide-react'; // Added FastForward
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { activeChild } = useActiveChildProfile();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/');
    } catch (error) {
      console.error("Sign out error", error);
      toast({ title: "Error", description: "Failed to sign out. Please try again.", variant: "destructive" });
    }
  };

  const menuItems = [
    { href: '/dashboard', label: 'Overview', icon: Home },
    { href: '/dashboard/profiles', label: 'Child Profiles', icon: Users },
    { href: '/dashboard/lessons/new', label: 'New Lesson', icon: PlusSquare, disabled: !activeChild },
    { href: '/dashboard/lessons', label: 'Lesson History', icon: History, disabled: !activeChild },
    { href: '/dashboard/discover', label: 'Explore Topics', icon: Search, disabled: !activeChild },
    { href: '/dashboard/recommendations', label: 'Next Lesson', icon: FastForward, disabled: !activeChild || !activeChild.lessonAttempts || activeChild.lessonAttempts.length === 0 },
    { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
    // { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <AuthGuard>
      <div className="flex h-[calc(100vh-var(--header-height,4rem))]">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r bg-card"> {/* Added bg-card for consistent theming */}
          <SidebarHeader className="flex items-center justify-between p-2">
            {currentUser && (
              <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:hidden">
                 <Avatar>
                  <AvatarImage src={`https://avatar.vercel.sh/${currentUser.email}.png?size=40`} alt={currentUser.email || 'User'} />
                  <AvatarFallback>{currentUser.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{currentUser.email}</span>
              </div>
            )}
            <SidebarTrigger className="md:hidden" />
          </SidebarHeader>

          {activeChild && (
            <div className="p-2 border-b group-data-[collapsible=icon]:hidden">
              <p className="text-xs text-muted-foreground mb-1">Active Profile:</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/${encodeURIComponent(activeChild.avatarSeed || activeChild.name)}.png?size=32`} alt={activeChild.name} />
                  <AvatarFallback>{activeChild.name[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{activeChild.name}</p>
                  <p className="text-xs text-muted-foreground">Age: {activeChild.age}</p>
                </div>
              </div>
            </div>
          )}
          
          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={{ children: item.label, className: "bg-primary text-primary-foreground" }}
                      disabled={item.disabled}
                      className={item.disabled ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <div className="mt-auto p-2 border-t">
             <SidebarMenuButton onClick={handleSignOut} tooltip={{ children: "Sign Out", className: "bg-destructive text-destructive-foreground"}}>
                <LogOut className="h-5 w-5 text-destructive" />
                <span className="group-data-[collapsible=icon]:hidden text-destructive">Sign Out</span>
              </SidebarMenuButton>
          </div>
        </Sidebar>
        <SidebarInset className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {children}
        </SidebarInset>
      </div>
    </AuthGuard>
  );
}

