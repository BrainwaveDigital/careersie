import Link from 'next/link'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// ProfileLinkClient is a client component (uses "use client") so we can
// import it directly here; avoid using next/dynamic with ssr:false inside a
// Server Component (Next.js disallows that). Importing a client component is
// a valid client boundary and it will render on the client.
import ProfileLinkClient from './ProfileLinkClient'

export const metadata = {
  title: 'Create Profile — Careersie',
}

export default function ProfileChoosePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">How would you like to create your profile?</h1>
          <p className="text-purple-200 mt-2">Choose the method that works best for you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white">View Profile</CardTitle>
              <CardDescription className="mt-2 text-purple-200">
                See your existing profile and edit it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-300">Open your saved profile page to view or update details.</p>
            </CardContent>
            <CardFooter className="justify-start">
              {/* ProfileLinkClient will link to the latest parsed CV if available (client-side) */}
              <ProfileLinkClient />
            </CardFooter>
          </Card>
          <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Upload Your CV</CardTitle>
              <CardDescription className="mt-2 text-purple-200">
                Quick and easy! Upload your existing CV and we'll extract the key information using AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc ml-5 text-sm text-purple-300 space-y-1">
                <li>Supports PDF, DOC, DOCX</li>
                <li>AI-powered information extraction</li>
                <li>Review and edit before saving</li>
              </ul>
            </CardContent>
            <CardFooter className="justify-start">
              <Link href="/profile/upload">
                <Button variant="default" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:scale-105 transition-transform">Upload CV</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Build Profile Manually</CardTitle>
              <CardDescription className="mt-2 text-purple-200">
                Create your profile from scratch with our guided form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc ml-5 text-sm text-purple-300 space-y-1">
                <li>Step-by-step guidance</li>
                <li>Complete control over content</li>
                <li>Takes about 5-10 minutes</li>
              </ul>
            </CardContent>
            <CardFooter className="justify-start">
              <Link href="/profile/manual">
                <Button variant="secondary" className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 rounded-full">Build Manually</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8 bg-purple-500/20 border-2 border-purple-400/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Complete Your Self-Reflection Insights
              </h3>
              <p className="text-purple-200 text-sm mb-4">
                Take 10 minutes to reflect on your career journey, goals, and what matters most to you professionally. 
                Your insights will help us match you with opportunities that align with your values and aspirations.
              </p>
              <Link href="/reflection">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:scale-105 transition-transform">
                  Start Reflection Questionnaire
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <Link href="/dashboard" className="text-purple-200 hover:text-white transition-colors">← Back</Link>
        </div>
      </div>
    </div>
  )
}
