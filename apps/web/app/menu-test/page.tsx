'use client';

import React, { useState } from 'react';
import { Search, FileText, Star, User, Image, Brain, Lightbulb, Target, Boxes, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MenuTestPage() {
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();

  const menuItems = [
    {
      id: 'find-jobs',
      icon: Search,
      title: 'Find Jobs',
      gradient: 'from-pink-500 via-purple-500 to-indigo-500',
      href: '/jobs'
    },
    {
      id: 'applications',
      icon: FileText,
      title: 'My Applications',
      gradient: 'from-cyan-400 via-blue-500 to-purple-600',
      href: '/applications'
    },
    {
      id: 'saved',
      icon: Star,
      title: 'Saved Jobs',
      gradient: 'from-amber-400 via-orange-500 to-pink-500',
      href: '/saved'
    },
    {
      id: 'profile',
      icon: User,
      title: 'Profile',
      gradient: 'from-green-400 via-emerald-500 to-teal-500',
      href: '/profile'
    },
    {
      id: 'media',
      icon: Image,
      title: 'Media Library',
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      href: '/media'
    },
    {
      id: 'personality',
      icon: Brain,
      title: 'Personality',
      gradient: 'from-rose-400 via-pink-500 to-purple-500',
      href: '/personality'
    },
    {
      id: 'reflection',
      icon: Lightbulb,
      title: 'Self-Reflection',
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      href: '/reflection'
    },
    {
      id: 'talent-story',
      icon: FileText,
      title: 'TalentStory',
      gradient: 'from-pink-500 via-purple-500 to-blue-500',
      href: '/talent-story/builder'
    },
    {
      id: 'job-customizer',
      icon: Target,
      title: 'Job Customizer',
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      href: '/jobs/customize'
    },
    {
      id: 'skills-3d',
      icon: Boxes,
      title: '3D Skills',
      gradient: 'from-blue-400 via-indigo-500 to-purple-600',
      href: '/skills-3d-enhanced'
    },
    {
      id: 'stories',
      icon: BookOpen,
      title: 'STAR Stories',
      gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
      href: '/story-test'
    }
  ];

  return (
    <div style={{ 
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      <style jsx global>{`
        body {
          background-color: #D2D2D2;
          background-image:
            repeating-linear-gradient(
              to right, transparent 0 100px,
              #25283b22 100px 101px
            ),
            repeating-linear-gradient(
              to bottom, transparent 0 100px,
              #25283b22 100px 101px
            );
        }
        
        body::before {
          position: absolute;
          width: min(1400px, 90vw);
          top: 10%;
          left: 50%;
          height: 90%;
          transform: translateX(-50%);
          content: '';
          background-size: 100%;
          background-repeat: no-repeat;
          background-position: top center;
          pointer-events: none;
        }

        @import url('https://fonts.cdnfonts.com/css/ica-rubrik-black');
        @import url('https://fonts.cdnfonts.com/css/poppins');

        .banner {
          width: 100%;
          height: 100vh;
          text-align: center;
          overflow: hidden;
          position: relative;
        }
        
        .banner .slider {
          position: absolute;
          width: 200px;
          height: 250px;
          top: 10%;
          left: calc(50% - 100px);
          transform-style: preserve-3d;
          transform: perspective(1000px);
          animation: autoRun 20s linear infinite;
          z-index: 2;
        }

        .banner .slider.paused {
          animation-play-state: paused;
        }
        
        @keyframes autoRun {
          from {
            transform: perspective(1000px) rotateX(-16deg) rotateY(0deg);
          }
          to {
            transform: perspective(1000px) rotateX(-16deg) rotateY(360deg);
          }
        }

        .banner .slider .item {
          position: absolute;
          inset: 0 0 0 0;
          transform: 
            rotateY(calc( (var(--position) - 1) * (360 / var(--quantity)) * 1deg))
            translateZ(550px);
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        
        .banner .slider .item:hover {
          transform: 
            rotateY(calc( (var(--position) - 1) * (360 / var(--quantity)) * 1deg))
            translateZ(600px);
        }
        
        .banner .slider .item .card {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .banner .slider .item:hover .card {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
        }

        .banner .slider .item .icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .banner .slider .item .icon-wrapper::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.3), transparent);
        }

        .banner .slider .item .card-title {
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
          text-align: center;
          font-family: 'Poppins', sans-serif;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }
        
        .banner .content {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: min(1400px, 100vw);
          height: max-content;
          padding-bottom: 100px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          z-index: 1;
        }
        
        .banner .content h1 {
          font-family: 'ICA Rubrik';
          font-size: 16em;
          line-height: 1em;
          color: #25283B;
          position: relative;
        }
        
        .banner .content h1::after {
          position: absolute;
          inset: 0 0 0 0;
          content: attr(data-content);
          z-index: 2;
          -webkit-text-stroke: 2px #d2d2d2;
          color: transparent;
        }
        
        .banner .content .author {
          font-family: Poppins;
          text-align: right;
          max-width: 200px;
        }
        
        .banner .content h2 {
          font-size: 3em;
        }
        
        .banner .content .model {
          width: 100%;
          height: 75vh;
          position: absolute;
          bottom: 0;
          left: 0;
          background-size: auto 130%;
          background-repeat: no-repeat;
          background-position: top center;
          z-index: 1;
        }
        
        @media screen and (max-width: 1023px) {
          .banner .slider {
            width: 160px;
            height: 200px;
            left: calc(50% - 80px);
          }
          .banner .slider .item {
            transform: 
              rotateY(calc( (var(--position) - 1) * (360 / var(--quantity)) * 1deg))
              translateZ(300px);
          }
          .banner .content h1 {
            text-align: center;
            width: 100%;
            text-shadow: 0 10px 20px #000;
            font-size: 7em;
          }
          .banner .content .author {
            color: #fff;
            padding: 20px;
            text-shadow: 0 10px 20px #000;
            z-index: 2;
            max-width: unset;
            width: 100%;
            text-align: center;
            padding: 0 30px;
          }
        }
        
        @media screen and (max-width: 767px) {
          .banner .slider {
            width: 100px;
            height: 150px;
            left: calc(50% - 50px);
          }
          .banner .slider .item {
            transform: 
              rotateY(calc( (var(--position) - 1) * (360 / var(--quantity)) * 1deg))
              translateZ(180px);
          }
          .banner .content h1 {
            font-size: 5em;
          }
        }
      `}</style>

      <div className="banner">
        <div 
          className={`slider ${isPaused ? 'paused' : ''}`} 
          style={{ '--quantity': menuItems.length } as React.CSSProperties}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className="item" 
                style={{ '--position': index + 1 } as React.CSSProperties}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onClick={() => router.push(item.href)}
              >
                <div className="card">
                  <div 
                    className={`icon-wrapper bg-gradient-to-br ${item.gradient}`}
                  >
                    <Icon className="w-10 h-10 text-white relative z-10" strokeWidth={2} />
                  </div>
                  <div className="card-title">{item.title}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="content">
          <h1 data-content="CAREERSIE">
            CAREERSIE
          </h1>
          <div className="author">
            <h2>Menu Test</h2>
            <p><b>3D Carousel</b></p>
            <p>
              Testing the rotating 3D carousel effect
            </p>
          </div>
          <div className="model"></div>
        </div>
      </div>
    </div>
  );
}
