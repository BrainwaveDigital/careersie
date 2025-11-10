import Link from 'next/link'

export const metadata = {
  title: 'Build Profile — Careersie',
}

export default function ProfileManualPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-4">Build your profile manually</h1>
        <p className="text-slate-600 mb-6">We'll guide you through each section—personal details, experience, skills, and education.</p>

        <div className="space-y-4 mb-6">
          <div className="p-4 border rounded">Personal details form placeholder</div>
          <div className="p-4 border rounded">Experience form placeholder</div>
          <div className="p-4 border rounded">Skills form placeholder</div>
        </div>

        <div className="flex gap-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md">Start</button>
          <Link href="/profile/choose" className="text-slate-600 px-4 py-2 rounded-md hover:text-slate-800">Cancel</Link>
        </div>
      </div>
    </div>
  )
}
