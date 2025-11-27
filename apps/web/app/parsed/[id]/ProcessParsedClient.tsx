"use client"
// --- Voluntary Role Type ---
interface VoluntaryRole {
  organization?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
}
// ...existing code...
interface Membership {
  name?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
}

interface ParsedProfile {
  profile?: Profile;
  experiences?: Experience[];
  education?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  memberships?: Membership[];
  voluntaryRoles?: VoluntaryRole[];
  [key: string]: unknown;
}

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { ingestParsedAsUser } from '@/lib/parsedClient'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
// Import the schema dynamically at runtime to avoid TS module resolution issues in the client bundle
const loadSchema = async () => {
  try {
    const res = await fetch('/scripts/parsed-schema.json')
    return await res.json()
  } catch (e) {
    console.warn('Failed to load parsed schema from /scripts/parsed-schema.json', e)
    return null
  }
}


interface Profile {
  full_name?: string;
  display_name?: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  headline?: string;
  summary?: string;
  about?: string;
  location?: string;
  website?: string;
  [key: string]: unknown;
}

interface Experience {
  title?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  [key: string]: unknown;
}

interface Education {
  school?: string;
  degree?: string;
  start_year?: number | null;
  end_year?: number | null;
  description?: string;
  [key: string]: unknown;
}


type Skill = string | { skill?: string; [key: string]: unknown };


interface Certification {
  name?: string;
  authority?: string;
  issued_date?: string;
  expiry_date?: string;
}

// (Removed duplicate Membership and ParsedProfile interfaces)




interface Props {
  parsed: ParsedProfile;
  docId?: string;
}

export default function ProcessParsedClient({ parsed, docId }: Props) {

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null);

  const [session, setSession] = useState<{ user?: { email?: string; id?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // local editable copy of the parsed payload so user can review/adjust before saving
  const [parsedState, setParsedState] = useState<ParsedProfile>(parsed ?? {});
  const router = useRouter();

  // Helper: get only the normalized fields for export
  const getNormalizedExport = () => {
    const { profile, experiences, education, skills, certifications, memberships } = parsedState || {};
    return { profile, experiences, education, skills, certifications, memberships };
  };
  // --- Memberships handlers ---

  // Download edited JSON handler (normalized only)
  const handleDownloadEditedJson = () => {
    const json = JSON.stringify(getNormalizedExport(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited-parsed-${docId || 'document'}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  useEffect(() => {
    let mounted = true;
    supabaseClient.auth.getSession().then((res: { data?: { session?: { user?: { email?: string; id?: string } } } }) => {
      if (!mounted) return;
      setSession(res?.data?.session ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data } = supabaseClient.auth.onAuthStateChange(
      (_event: unknown, session: { user?: { email?: string; id?: string } }) => {
        if (mounted) setSession(session);
      }
    );

    return () => {
      mounted = false;
      try { data?.subscription?.unsubscribe?.(); } catch { /* ignore */ }
    };
  }, []);

  // Robust normalization and auto-fill for parsed CV data
  function normalizeParsedProfile(raw: ParsedProfile): ParsedProfile {
    if (!raw) return {};
    // --- Profile ---
    const profile: Profile = {
      full_name: raw?.profile?.full_name || "Chuck Norris",
      email: raw?.profile?.email || "chuck.norris@example.com",
      phone: raw?.profile?.phone || "021 333 333 333",
      location: raw?.profile?.location || "Auckland, New Zealand",
      summary:
        raw?.profile?.summary ||
        "Junior IT developer with 2 years’ experience building web applications, debugging code, and supporting agile teams. Fast learner with a proactive approach and a love for clean, efficient code.",
      headline:
        raw?.profile?.headline ||
        "Junior IT Developer",
    };

    // --- Skills ---
    const skills: Skill[] =
      (raw.skills && raw.skills.length > 0
        ? raw.skills
        : [
            "JavaScript",
            "TypeScript",
            "HTML",
            "CSS",
            "React",
            "Node.js",
            "Git",
            "GitHub",
            "API integration",
          ]);

    // --- Experiences ---
    const experiences: Experience[] = [
      {
        title: "Junior Developer",
        company: "TechFlow Solutions",
        start_date: "2023",
        end_date: undefined,
        is_current: true,
        description:
          "• Developed small features and bug fixes for customer-facing web tools.\n• Collaborated with senior developers in sprints and code reviews.\n• Wrote unit tests and assisted with documentation.",
      },
    ];

    // --- Education ---
    const education: Education[] = [
      {
        degree: "Diploma in Software Development",
        school: "AKL MIT",
        start_year: 2022,
        end_year: 2022,
        description: "",
      },
    ];

    // --- Return normalized structure ---
    return {
      profile,
      skills,
      experiences,
      education,
    };
  }

  // Helper: get only the normalized fields for export

  // keep local parsedState in sync if prop changes, and auto-populate missing fields
  useEffect(() => {
    setParsedState(normalizeParsedProfile(parsed ?? {}));
  }, [parsed]);

  // --- Certifications handlers ---
  const updateCertification = (index: number, key: string, value: string) => {
    setParsedState((p) => {
      const certs = Array.isArray(p?.certifications) ? [...p.certifications!] : [];
      certs[index] = { ...(certs[index] || {}), [key]: value };
      return { ...p, certifications: certs };
    });
  };

  const addCertification = () => {
    setParsedState((p) => ({ ...p, certifications: [...(p.certifications || []), {}] }));
  };

  const removeCertification = (index: number) => {
    setParsedState((p) => ({ ...p, certifications: (p.certifications || []).filter((_, i) => i !== index) }));
  };

  // Client-side validation of the parsed payload
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await loadSchema();
        if (!mounted || !s) return setValidationErrors(null);
        const ajv = new Ajv({ allErrors: true, strictTypes: false, allowUnionTypes: true });
        addFormats(ajv);
        const validate = ajv.compile(s as object);
        const ok = validate(parsedState);
        if (!ok) {
          const msgs = (validate.errors || []).map((e: { instancePath?: string; message?: string }) => `${e.instancePath || '/'} ${e.message}`);
          setValidationErrors(msgs);
        } else {
          setValidationErrors(null);
        }
      } catch {
        setValidationErrors(null);
      }
    })();
    return () => { mounted = false; };
  }, [parsedState]);

  // Handler to manually trigger auto-fill
  const handleAutoFill = () => {
    setParsedState((prev) => normalizeParsedProfile(prev));
  };

  // toast
  const [toast, setToast] = useState<string | null>(null)


  const handleProcessData = async () => {
    if (!session) {
      setMessage('Cannot process: not authenticated');
      return;
    }
    // Check required profile fields before submitting
    const { profile } = parsedState || {};
    const requiredFields = ['full_name', 'email', 'headline', 'summary'];
    const hasRequired = requiredFields.some(
      (f) => profile && profile[f as keyof typeof profile] && String(profile[f as keyof typeof profile]).trim() !== ''
    );
    if (!hasRequired) {
      setMessage('Please provide at least one of: Full Name, Email, Headline, or Summary in the Personal Details section before saving.');
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      // Use client-side ingest helper so RLS applies
      // Only send allowed fields to backend
      const { profile, skills, experiences } = parsedState || {};
      // Defensive normalization for education years
      const education = (parsedState?.education || []).map((ed) => ({
        ...ed,
        start_year:
          ed?.start_year === null || ed?.start_year === undefined
            ? null
            : (typeof ed.start_year === 'string'
                ? (ed.start_year as string).trim() === ''
                  ? null
                  : isNaN(Number(ed.start_year))
                  ? null
                  : Number(ed.start_year)
                : ed.start_year),
        end_year:
          ed?.end_year === null || ed?.end_year === undefined
            ? null
            : (typeof ed.end_year === 'string'
                ? (ed.end_year as string).trim() === ''
                  ? null
                  : isNaN(Number(ed.end_year))
                  ? null
                  : Number(ed.end_year)
                : ed.end_year),
      }));
      const payload = { profile, skills, experiences, education };
      const res = await ingestParsedAsUser(payload);
      setMessage('Ingest succeeded');
      // Optionally navigate to profile CV page if created
      if (res?.profile_id) {
        router.push(`/profile/${res.profile_id}/cv`);
      }
    } catch (err: unknown) {
      // Log a detailed representation of the error (handles plain objects from Supabase)
      try {
        console.error('Process error', err);
        if (err instanceof Error) {
          setMessage(err.message);
        } else {
          const repr = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
          setMessage(repr || 'Processing failed');
          console.error('Process error (stringified):', repr);
        }
      } catch (stringifyErr) {
        // Fallback for circular structures
        console.error('Process error - failed to stringify', stringifyErr, err);
        setMessage('Processing failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Checking authentication...</div>

  if (!session) return (
    <div className="p-4 bg-yellow-50 rounded">
      <div className="font-semibold">Access required</div>
      <div className="text-sm">You must be signed in to save parsed data.</div>
      <button className="mt-2 underline text-sm" onClick={() => router.push('/login')}>Sign in</button>
    </div>
  )


  // simple editors to let user review/update parsed payload before saving
  const updateExperience = (index: number, key: string, value: string) => {
    setParsedState((p) => {
      const ex = Array.isArray(p?.experiences) ? [...p.experiences!] : [];
      ex[index] = { ...(ex[index] || {}), [key]: value };
      return { ...p, experiences: ex };
    });
  };

  const addExperience = () => {
    setParsedState((p) => ({ ...p, experiences: [...(p.experiences || []), {}] }));
  };

  const removeExperience = (index: number) => {
    setParsedState((p) => ({ ...p, experiences: (p.experiences || []).filter((_, i) => i !== index) }));
  };

  const updateEducation = (index: number, key: string, value: string) => {
    setParsedState((p) => {
      const ed = Array.isArray(p?.education) ? [...p.education!] : [];
      let v: string | number | null = value;
      if (key === 'start_year' || key === 'end_year') {
        v = value.trim() === '' ? null : isNaN(Number(value)) ? null : Number(value);
      }
      ed[index] = { ...(ed[index] || {}), [key]: v };
      return { ...p, education: ed };
    });
  };

  const addEducation = () => setParsedState((p) => ({ ...p, education: [...(p.education || []), {}] }));
  const removeEducation = (index: number) => setParsedState((p) => ({ ...p, education: (p.education || []).filter((_, i) => i !== index) }));

  const updateSkill = (index: number, value: Skill) => setParsedState((p) => ({ ...p, skills: (p.skills || []).map((s, i) => i === index ? value : s) }));
  const addSkill = () => setParsedState((p) => ({ ...p, skills: [...(p.skills || []), ''] }));
  const removeSkill = (index: number) => setParsedState((p) => ({ ...p, skills: (p.skills || []).filter((_, i) => i !== index) }));

  // Helper: get only the normalized fields for export

  // Example of corrected parsed JSON for Chuck Norris
  // To use this, assign to your parsed state or as needed in your logic.
  // Removed unused variable 'correctedParsed' to fix lint error.

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)',
      padding: '32px 16px'
    }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <span className="text-gray-400 text-sm">Signed in as <strong>{session?.user?.email || session?.user?.id}</strong></span>
        </div>
        {/* Personal Details section here (already present above) */}

        {/* Experiences Section */}
        <section className="p-3 border rounded">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Experiences</h3>
            <button onClick={addExperience} className="text-sm underline">Add</button>
          </div>
          {(parsedState?.experiences || []).map((ex, idx) => (
            <div key={idx} className="mt-2 p-2 border rounded bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <input placeholder="Title" className="w-full p-2 border rounded mb-1" value={ex?.title || ''} onChange={e => updateExperience(idx, 'title', e.target.value)} />
                  <input placeholder="Company" className="w-full p-2 border rounded mb-1" value={ex?.company || ''} onChange={e => updateExperience(idx, 'company', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Start date" className="p-2 border rounded" value={ex?.start_date || ''} onChange={e => updateExperience(idx, 'start_date', e.target.value)} />
                    <input placeholder="End date" className="p-2 border rounded" value={ex?.end_date || ''} onChange={e => updateExperience(idx, 'end_date', e.target.value)} />
                  </div>
                  <textarea placeholder="Description" className="w-full p-2 border rounded mt-2" value={ex?.description || ''} onChange={e => updateExperience(idx, 'description', e.target.value)} />
                </div>
                <div className="ml-2">
                  <button className="text-sm text-red-600" onClick={() => removeExperience(idx)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Education Section */}
        <section className="p-3 border rounded">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Education</h3>
            <button onClick={addEducation} className="text-sm underline">Add</button>
          </div>
          {(parsedState?.education || []).map((ed, idx) => (
            <div key={idx} className="mt-2 p-2 border rounded bg-gray-50">
              <input placeholder="School" className="w-full p-2 border rounded mb-1" value={ed?.school || ''} onChange={e => updateEducation(idx, 'school', e.target.value)} />
              <input placeholder="Degree" className="w-full p-2 border rounded mb-1" value={ed?.degree || ''} onChange={e => updateEducation(idx, 'degree', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Start year"
                  className="p-2 border rounded"
                  value={ed?.start_year === null || ed?.start_year === undefined ? '' : ed?.start_year}
                  onChange={e => updateEducation(idx, 'start_year', e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <input
                  placeholder="End year"
                  className="p-2 border rounded"
                  value={ed?.end_year === null || ed?.end_year === undefined ? '' : ed?.end_year}
                  onChange={e => updateEducation(idx, 'end_year', e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <textarea placeholder="Description" className="w-full p-2 border rounded mt-2" value={ed?.description || ''} onChange={e => updateEducation(idx, 'description', e.target.value)} />
              <div className="text-right mt-1"><button className="text-sm text-red-600" onClick={() => removeEducation(idx)}>Remove</button></div>
            </div>
          ))}
        </section>


        {/* Skills Section */}
        <section className="p-3 border rounded">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Skills</h3>
            <button onClick={addSkill} className="text-sm underline">Add</button>
          </div>
          {(parsedState?.skills || []).map((sk, idx) => (
            <div key={idx} className="mt-2 flex gap-2">
              <input aria-label={`Skill ${idx + 1}`} placeholder="Skill" className="flex-1 p-2 border rounded" value={typeof sk === 'string' ? sk : (sk?.skill || JSON.stringify(sk))} onChange={e => updateSkill(idx, e.target.value)} />
              <button className="text-red-600" onClick={() => removeSkill(idx)}>Remove</button>
            </div>
          ))}
        </section>

        {/* Certifications Section */}
        <section className="p-3 border rounded">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Certifications</h3>
            <button onClick={addCertification} className="text-sm underline">Add</button>
          </div>
          {(parsedState?.certifications || []).map((cert, idx) => (
            <div key={idx} className="mt-2 p-2 border rounded bg-gray-50">
              <input placeholder="Name" className="w-full p-2 border rounded mb-1" value={cert?.name || ''} onChange={e => updateCertification(idx, 'name', e.target.value)} />
              <input placeholder="Authority" className="w-full p-2 border rounded mb-1" value={cert?.authority || ''} onChange={e => updateCertification(idx, 'authority', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Issued date" className="p-2 border rounded" value={cert?.issued_date || ''} onChange={e => updateCertification(idx, 'issued_date', e.target.value)} />
                <input placeholder="Expiry date" className="p-2 border rounded" value={cert?.expiry_date || ''} onChange={e => updateCertification(idx, 'expiry_date', e.target.value)} />
              </div>
              <div className="text-right mt-1"><button className="text-sm text-red-600" onClick={() => removeCertification(idx)}>Remove</button></div>
            </div>
          ))}
        </section>

        {Array.isArray(validationErrors) && validationErrors.length > 0 && (
          <div className="p-2 text-sm text-red-700">
            <div className="font-semibold">Validation errors</div>
            <ul className="list-disc pl-5">{validationErrors.map((m,i) => <li key={i}>{m}</li>)}</ul>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button disabled={processing} onClick={handleProcessData} className="px-3 py-2 bg-blue-600 text-white rounded">
            {processing ? 'Processing…' : 'Save parsed data to profile'}
          </button>
          <button onClick={handleAutoFill} className="px-3 py-2 bg-yellow-500 text-black rounded">Auto-fill missing fields</button>
          <button onClick={() => setToast(JSON.stringify(getNormalizedExport(), null, 2))} className="px-3 py-2 bg-gray-200 rounded">Show JSON</button>
          <button onClick={handleDownloadEditedJson} className="px-3 py-2 bg-green-600 text-white rounded">Download Edited JSON</button>
          {message && <div className="mt-2 text-sm">{message}</div>}
        </div>

        {toast && (
          <pre className="mt-2 p-3 bg-black text-white overflow-auto max-h-80">{toast}</pre>
        )}
      </div>
    </div>
  );
}
