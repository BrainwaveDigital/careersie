'use client';

import React, { useState } from 'react';
import { Search, FileText, Star, User, Image, Brain, Lightbulb, LogOut, Target, Boxes, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';

const OrbMenu = () => {
  const [hoveredOrb, setHoveredOrb] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    {
      id: 'find-jobs',
      icon: Search,
      title: 'Find Jobs',
      description: 'Browse thousands of opportunities',
      gradient: 'from-pink-500 via-purple-500 to-indigo-500',
      glowColor: 'rgba(236, 72, 153, 0.4)',
      href: '/jobs'
    },
    {
      id: 'applications',
      icon: FileText,
      title: 'My Applications',
      description: 'Track your job applications',
      gradient: 'from-cyan-400 via-blue-500 to-purple-600',
      glowColor: 'rgba(34, 211, 238, 0.4)',
      href: '/applications'
    },
    {
      id: 'saved',
      icon: Star,
      title: 'Saved Jobs',
      description: 'Your favorite postings',
      gradient: 'from-amber-400 via-orange-500 to-pink-500',
      glowColor: 'rgba(251, 191, 36, 0.4)',
      href: '/saved'
    },
    {
      id: 'profile',
      icon: User,
      title: 'Profile',
      description: 'Complete your profile',
      gradient: 'from-green-400 via-emerald-500 to-teal-500',
      glowColor: 'rgba(74, 222, 128, 0.4)',
      href: '/profile'
    },
    {
      id: 'media',
      icon: Image,
      title: 'Media Library',
      description: 'Manage your content',
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      glowColor: 'rgba(139, 92, 246, 0.4)',
      href: '/media'
    },
    {
      id: 'personality',
      icon: Brain,
      title: 'Personality',
      description: 'Work style assessment',
      gradient: 'from-rose-400 via-pink-500 to-purple-500',
      glowColor: 'rgba(251, 113, 133, 0.4)',
      href: '/personality'
    },
    {
      id: 'reflection',
      icon: Lightbulb,
      title: 'Self-Reflection',
      description: 'Career insights & goals',
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      glowColor: 'rgba(250, 204, 21, 0.4)',
      href: '/reflection'
    },
    {
      id: 'talent-story',
      icon: FileText,
      title: 'TalentStory',
      description: 'Generate your career narrative',
      gradient: 'from-pink-500 via-purple-500 to-blue-500',
      glowColor: 'rgba(236, 72, 153, 0.5)',
      href: '/talent-story/builder'
    },
    {
      id: 'job-customizer',
      icon: Target,
      title: 'Job Customizer',
      description: 'Tailor your story to each job',
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      glowColor: 'rgba(52, 211, 153, 0.5)',
      href: '/jobs/customize'
    },
    {
      id: 'skills-3d',
      icon: Boxes,
      title: '3D Skills',
      description: 'Visualize your skills in 3D',
      gradient: 'from-blue-400 via-indigo-500 to-purple-600',
      glowColor: 'rgba(99, 102, 241, 0.5)',
      href: '/skills-3d-enhanced'
    },
    {
      id: 'menu-test',
      icon: Boxes,
      title: 'Menu Test',
      description: '3D carousel test',
      gradient: 'from-purple-400 via-pink-500 to-red-500',
      glowColor: 'rgba(168, 85, 247, 0.5)',
      href: '/menu-test'
    },
    {
      id: 'stories',
      icon: BookOpen,
      title: 'STAR Stories',
      description: 'Craft achievement narratives',
      gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
      glowColor: 'rgba(99, 102, 241, 0.4)',
      href: '/story-test'
    }
  ];

  const handleOrbClick = (href: string) => {
    router.push(href);
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 style={{ color: '#FFFFFF' }} className="text-5xl font-bold mb-2">
              Careersie
            </h1>
            <p style={{ color: '#9AA4B2' }} className="text-lg">Welcome back! 👋</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '12px 24px',
              color: '#FFFFFF',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            className="hover:bg-white/10 hover:-translate-y-0.5"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Orb Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isHovered = hoveredOrb === item.id;
          
          return (
            <div
              key={item.id}
              className="relative group cursor-pointer"
              onMouseEnter={() => setHoveredOrb(item.id)}
              onMouseLeave={() => setHoveredOrb(null)}
              onClick={() => handleOrbClick(item.href)}
              style={{
                transform: isHovered ? 'translateY(-12px)' : 'translateY(0)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              {/* Glow Effect */}
              <div
                className="absolute inset-0 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: item.glowColor,
                  transform: 'scale(1.1)'
                }}
              />
              
              {/* Glass Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(25px)',
                borderRadius: '24px',
                padding: '32px',
                height: '100%',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Animated Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />
                
                {/* Orb Container */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* 3D Orb */}
                  <div
                    className="relative mb-6"
                    style={{
                      transform: isHovered ? 'rotateY(180deg) scale(1.1)' : 'rotateY(0deg) scale(1)',
                      transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <div
                      className={`w-24 h-24 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center relative`}
                      style={{
                        boxShadow: `0 20px 60px ${item.glowColor}, inset 0 -10px 20px rgba(0,0,0,0.2), inset 0 10px 20px rgba(255,255,255,0.2)`
                      }}
                    >
                      {/* Shine Effect */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                      
                      <Icon className="w-12 h-12 text-white relative z-10" strokeWidth={2} />
                    </div>
                    
                    {/* Floating Particles */}
                    {isHovered && (
                      <>
                        <div className="absolute -top-2 -right-2 w-3 h-3 bg-white rounded-full animate-ping" />
                        <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-pink-300 rounded-full animate-pulse" />
                      </>
                    )}
                  </div>
                  
                  {/* Text Content */}
                  <h3 style={{ color: '#FFFFFF' }} className="text-2xl font-bold mb-2">
                    {item.title}
                  </h3>
                  <p style={{ color: '#9AA4B2' }} className="text-sm">
                    {item.description}
                  </p>
                  
                  {/* Action Button */}
                  <button
                    style={{
                      marginTop: '24px',
                      padding: '8px 24px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '14px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                    className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 hover:bg-white/10"
                  >
                    Open
                  </button>
                </div>
                
                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto mt-16 text-center">
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(25px)',
          borderRadius: '24px',
          padding: '32px'
        }}>
          <h2 style={{ color: '#FFFFFF' }} className="text-3xl font-bold mb-4">
            Ready to level up your career? 🚀
          </h2>
          <p style={{ color: '#9AA4B2' }} className="mb-6">
            Complete your profile and start applying to your dream jobs today
          </p>
          <button 
            onClick={() => router.push('/profile')}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
              borderRadius: '14px',
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: '18px',
              border: 'none',
              boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            className="hover:shadow-[0_6px_20px_rgba(79,241,227,0.4)] hover:-translate-y-0.5"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrbMenu;
