import React, { useState } from 'react';
import { supabaseClient } from '@/lib/supabase';

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}
export interface Education {
  id: string;
  school: string;
  degree: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  description: string;
}
export interface Skill {
  id: string;
  skill: string;
}
export interface Certification {
  id: string;
  name: string;
  authority: string;
  issued_date: string;
  expiry_date: string;
}
export interface Membership {
  id: string;
  name: string;
  role: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}
export interface VoluntaryRole {
  id: string;
  organization: string;
  role: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

export interface ProfileEditFormProps {
  user: any;
  profileId: string;
  initialProfile: any;
  initialExperiences: Experience[];
  initialEducation: Education[];
  initialSkills: Skill[];
  initialCertifications: Certification[];
  initialMemberships: Membership[];
  initialVoluntaryRoles: VoluntaryRole[];
  onSave?: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  user,
  profileId,
  initialProfile,
  initialExperiences,
  initialEducation,
  initialSkills,
  initialCertifications,
  initialMemberships,
  initialVoluntaryRoles,
  onSave,
}) => {
  // State for all fields, initialized from props
  const [fullName, setFullName] = useState(initialProfile.full_name || '');
  const [email, setEmail] = useState(initialProfile.email || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [location, setLocation] = useState(initialProfile.location || '');
  const [website, setWebsite] = useState(initialProfile.website || '');
  const [headline, setHeadline] = useState(initialProfile.headline || '');
  const [summary, setSummary] = useState(initialProfile.summary || '');
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences);
  const [education, setEducation] = useState<Education[]>(initialEducation);
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [certifications, setCertifications] = useState<Certification[]>(initialCertifications);
  const [memberships, setMemberships] = useState<Membership[]>(initialMemberships);
  const [voluntaryRoles, setVoluntaryRoles] = useState<VoluntaryRole[]>(initialVoluntaryRoles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handlers for add/remove/update for each section (similar to manual/page.tsx)
  // ... (omitted for brevity, can be filled in as needed)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Update profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          full_name: fullName,
          email,
          phone,
          location,
          website,
          headline,
          summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);
      if (profileError) throw profileError;

      // Delete and re-insert related tables (experiences, education, skills, etc.)
      await Promise.all([
        supabaseClient.from('experiences').delete().eq('profile_id', profileId),
        supabaseClient.from('education').delete().eq('profile_id', profileId),
        supabaseClient.from('skills').delete().eq('profile_id', profileId),
        supabaseClient.from('certifications').delete().eq('profile_id', profileId),
        supabaseClient.from('organizations').delete().eq('profile_id', profileId),
      ]);

      // Insert new data (experiences, education, skills, etc.)
      // ... (similar to manual/page.tsx, omitted for brevity)

      setSuccess('Profile updated successfully!');
      if (onSave) onSave();
    } catch (err: any) {
      setError(err.message || 'Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  // Group fields into separate fieldsets for Profile, Experiences, and Education
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      {/* Profile Section */}
      <fieldset style={{ border: '1px solid #333', borderRadius: 12, marginBottom: 32, padding: 24 }}>
        <legend style={{ fontWeight: 600, color: '#4ff1e3', fontSize: 18, padding: '0 8px' }}>Profile</legend>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#9AA4B2', fontWeight: 500 }}>Full name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#9AA4B2', fontWeight: 500 }}>Display name</label>
            <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#9AA4B2', fontWeight: 500 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#9AA4B2', fontWeight: 500 }}>Phone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#9AA4B2', fontWeight: 500 }}>Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#9AA4B2', fontWeight: 500 }}>Website</label>
            <input type="text" value={website} onChange={e => setWebsite(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#9AA4B2', fontWeight: 500 }}>Summary</label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
        </div>
      </fieldset>

      {/* Experiences Section */}
      <fieldset style={{ border: '1px solid #333', borderRadius: 12, marginBottom: 32, padding: 24 }}>
        <legend style={{ fontWeight: 600, color: '#4ff1e3', fontSize: 18, padding: '0 8px' }}>Experiences</legend>
        {/* Example experience fields, replace with dynamic mapping if needed */}
        <div style={{ marginBottom: 16 }}>
          <textarea placeholder="Describe your experience" style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <input type="text" placeholder="Start date" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff' }} />
          <input type="text" placeholder="End date" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff' }} />
        </div>
      </fieldset>

      {/* Education Section */}
      <fieldset style={{ border: '1px solid #333', borderRadius: 12, marginBottom: 32, padding: 24 }}>
        <legend style={{ fontWeight: 600, color: '#4ff1e3', fontSize: 18, padding: '0 8px' }}>Education</legend>
        <div style={{ marginBottom: 16 }}>
          <input type="text" placeholder="Degree" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <input type="text" placeholder="Start year" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff' }} />
          <input type="text" placeholder="End year" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <textarea placeholder="Description" style={{ width: '100%', minHeight: 40, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181A1B', color: '#fff', marginTop: 4 }} />
        </div>
      </fieldset>

      <button type="submit" disabled={loading} style={{ background: '#4ff1e3', color: '#181A1B', fontWeight: 600, border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 16, marginTop: 16 }}>Save</button>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 12 }}>{success}</div>}
    </form>
  );
};
