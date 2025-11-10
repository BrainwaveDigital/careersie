import Link from 'next/link'

export const metadata = {
  title: 'Upload CV — Careersie',
}

export default function ProfileUploadPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-4">Upload your CV</h1>
        <p className="text-slate-600 mb-6">Upload a PDF/DOC/DOCX and we'll extract profile fields automatically. You can review and edit the results before saving.</p>

        <div className="border border-dashed border-slate-200 rounded-md p-8 text-center mb-6">
          <p className="text-slate-500">(Upload UI placeholder) Drop a file here or click to select</p>
        </div>

        <div className="flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Upload & Parse</button>
          <Link href="/profile/choose" className="text-slate-600 px-4 py-2 rounded-md hover:text-slate-800">Cancel</Link>
        </div>
      </div>
    </div>
  )
}
