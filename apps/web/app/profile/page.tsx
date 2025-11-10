import Link from 'next/link'

export const metadata = {
  title: 'Your Profile — Careersie',
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
        <p className="text-slate-600 mb-6">This is a placeholder for the user's profile. If no profile exists, we should redirect to <Link href="/profile/choose" className="text-blue-600">Create Profile</Link>.</p>

        <div className="p-4 border rounded mb-4">Profile data placeholder (name, experience, skills)</div>

        <div className="flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Edit</button>
          <Link href="/profile/choose" className="text-slate-600 px-4 py-2 rounded-md hover:text-slate-800">Back</Link>
        </div>
      </div>
    </div>
  )
}
