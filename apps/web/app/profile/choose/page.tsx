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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: '1280px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#FFFFFF' }}>How would you like to create your profile?</h1>
          <p style={{ color: '#9AA4B2', marginTop: '8px' }}>Choose the method that works best for you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card style={{
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>View Profile</CardTitle>
              <CardDescription style={{ marginTop: '8px', color: '#9AA4B2' }}>
                See your existing profile and edit it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '14px', color: '#9AA4B2' }}>Open your saved profile page to view or update details.</p>
            </CardContent>
            <CardFooter className="justify-start">
              {/* ProfileLinkClient will link to the latest parsed CV if available (client-side) */}
              <ProfileLinkClient />
            </CardFooter>
          </Card>
          <Card style={{
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Upload Your CV</CardTitle>
              <CardDescription style={{ marginTop: '8px', color: '#9AA4B2' }}>
                Quick and easy! Upload your existing CV and we'll extract the key information using AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc ml-5 text-sm space-y-1" style={{ color: '#9AA4B2' }}>
                <li>Supports PDF, DOC, DOCX</li>
                <li>AI-powered information extraction</li>
                <li>Review and edit before saving</li>
              </ul>
            </CardContent>
            <CardFooter className="justify-start">
              <Link href="/profile/upload">
                <Button variant="default" style={{
                  background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                  borderRadius: '14px',
                  boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)'
                }}>Upload CV</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card style={{
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Build Profile Manually</CardTitle>
              <CardDescription style={{ marginTop: '8px', color: '#9AA4B2' }}>
                Create your profile from scratch with our guided form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc ml-5 text-sm space-y-1" style={{ color: '#9AA4B2' }}>
                <li>Step-by-step guidance</li>
                <li>Complete control over content</li>
                <li>Takes about 5-10 minutes</li>
              </ul>
            </CardContent>
            <CardFooter className="justify-start">
              <Link href="/profile/manual">
                <Button variant="secondary" style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9AA4B2',
                  borderRadius: '14px'
                }}>Build Manually</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <div style={{
          marginTop: '32px',
          background: 'rgba(79, 241, 227, 0.1)',
          border: '2px solid rgba(79, 241, 227, 0.3)',
          borderRadius: '20px',
          padding: '24px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="flex items-start gap-4">
            <div style={{ fontSize: '36px' }}>💡</div>
            <div className="flex-1">
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '8px' }}>
                Complete Your Self-Reflection Insights
              </h3>
              <p style={{ color: '#9AA4B2', fontSize: '14px', marginBottom: '16px' }}>
                Take 10 minutes to reflect on your career journey, goals, and what matters most to you professionally. 
                Your insights will help us match you with opportunities that align with your values and aspirations.
              </p>
              <Link href="/reflection">
                <Button style={{
                  background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                  borderRadius: '14px',
                  boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)'
                }}>
                  Start Reflection Questionnaire
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          <Link href="/dashboard" style={{ color: '#4ff1e3', transition: 'opacity 0.2s' }} className="hover:opacity-80">← Back</Link>
        </div>
      </div>
    </div>
  )
}
