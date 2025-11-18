/**
 * Integration Test: TalentStory Generation
 * 
 * Tests the complete flow:
 * 1. Mock profile data → ProfileStoryInput
 * 2. ProfileStoryInput → OpenAI → TalentStory narrative
 * 3. Verify output format and quality
 * 
 * Usage: node scripts/test-talent-story.js
 */

import { generateTalentStory } from '../apps/web/src/lib/talentStoryEngine.ts';

// Mock ProfileStoryInput data
const mockProfileData = {
  personalInfo: {
    name: "Sarah Chen",
    title: "Senior Full-Stack Developer",
    location: "San Francisco, CA"
  },
  summary: "Passionate developer with 6 years of experience building scalable web applications. Specialized in React, Node.js, and cloud architecture.",
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "AWS",
    "Docker",
    "CI/CD",
    "System Design",
    "Agile/Scrum"
  ],
  experience: [
    {
      title: "Senior Full-Stack Developer",
      company: "TechCorp Inc",
      startDate: "2021-06",
      endDate: undefined,
      responsibilities: [
        "Led development of microservices architecture serving 2M+ users",
        "Mentored team of 4 junior developers",
        "Implemented CI/CD pipeline reducing deployment time by 60%"
      ],
      achievements: [
        "Reduced API response time by 40% through optimization",
        "Built real-time notification system handling 100K+ events/day"
      ]
    },
    {
      title: "Full-Stack Developer",
      company: "StartupXYZ",
      startDate: "2019-03",
      endDate: "2021-05",
      responsibilities: [
        "Built React dashboard used by 10K+ customers",
        "Designed and implemented RESTful APIs",
        "Set up AWS infrastructure with CloudFormation"
      ],
      achievements: [
        "Shipped 3 major product features ahead of schedule",
        "Improved test coverage from 40% to 85%"
      ]
    }
  ],
  projects: [
    {
      name: "E-commerce Platform Redesign",
      description: "Complete overhaul of legacy system to modern stack",
      impact: "Increased conversion rate by 25% and reduced load time by 50%"
    }
  ],
  education: [
    {
      institution: "Stanford University",
      degree: "BS in Computer Science",
      year: "2018"
    }
  ],
  media: [
    {
      type: "portfolio",
      url: "https://github.com/sarahchen",
      caption: "GitHub Portfolio"
    }
  ],
  careerGoals: [
    "Become a tech lead at a product-focused company",
    "Contribute to open-source projects",
    "Build products that improve people's lives"
  ]
};

async function testTalentStoryGeneration() {
  console.log('🚀 Testing TalentStory Generation...\n');
  console.log('📊 Input Data:');
  console.log(`   Name: ${mockProfileData.personalInfo.name}`);
  console.log(`   Title: ${mockProfileData.personalInfo.title}`);
  console.log(`   Skills: ${mockProfileData.skills.length}`);
  console.log(`   Experience: ${mockProfileData.experience.length} roles`);
  console.log(`   Projects: ${mockProfileData.projects?.length || 0}`);
  console.log('\n⏳ Generating TalentStory with OpenAI...\n');

  try {
    const startTime = Date.now();
    const story = await generateTalentStory(mockProfileData, 'gpt-4o-mini');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ TalentStory Generated Successfully!\n');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📝 Length: ${story.length} characters\n`);
    console.log('─'.repeat(80));
    console.log(story);
    console.log('─'.repeat(80));
    console.log('\n✅ Test Complete!');
    console.log('\n📋 Validation:');
    
    // Basic validation
    const hasNarrativeSummary = story.includes('Narrative Summary') || story.includes('## 1');
    const hasSkillThemes = story.includes('Skill Themes') || story.includes('## 2');
    const hasCareerTimeline = story.includes('Career Timeline') || story.includes('## 3');
    const hasStrengths = story.includes('Strengths') || story.includes('Superpowers');
    const hasHighlights = story.includes('Career Highlights') || story.includes('## 5');
    const hasDirections = story.includes('Career Directions') || story.includes('## 6');

    console.log(`   ${hasNarrativeSummary ? '✅' : '❌'} Narrative Summary`);
    console.log(`   ${hasSkillThemes ? '✅' : '❌'} Skill Themes`);
    console.log(`   ${hasCareerTimeline ? '✅' : '❌'} Career Timeline`);
    console.log(`   ${hasStrengths ? '✅' : '❌'} Strengths & Superpowers`);
    console.log(`   ${hasHighlights ? '✅' : '❌'} Career Highlights`);
    console.log(`   ${hasDirections ? '✅' : '❌'} Recommended Career Directions`);

    const allSectionsPresent = hasNarrativeSummary && hasSkillThemes && 
                               hasCareerTimeline && hasStrengths && 
                               hasHighlights && hasDirections;

    if (allSectionsPresent) {
      console.log('\n🎉 All expected sections are present!');
    } else {
      console.log('\n⚠️  Some sections may be missing or named differently');
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check OPENAI_API_KEY is set in .env.local');
    console.error('   2. Verify API key has sufficient credits');
    console.error('   3. Check internet connection');
    console.error('   4. Review error details above');
    process.exit(1);
  }
}

// Run test
testTalentStoryGeneration();
