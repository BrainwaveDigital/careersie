import React from 'react';

export interface ProfileDisplayProps {
  profile: any;
  experiences: any[];
  education: any[];
  skills: any[];
  certifications?: any[];
  memberships?: any[];
  voluntary?: any[];
}

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  profile,
  experiences,
  education,
  skills,
  certifications = [],
  memberships = [],
  voluntary = [],
}) => {
  const fmtDate = (d: string | undefined | null) => {
    try {
      if (!d) return '';
      const dt = new Date(d);
      return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short' }).format(dt);
    } catch (e) {
      return String(d);
    }
  };

  return (
    <div>
      {/* Personal Details */}
      <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', boxShadow: '0 0 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(25px)' }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ color: '#FFFFFF', fontSize: '2rem', fontWeight: 700 }}>{profile.full_name || '—'}</h2>
          <div style={{ color: '#9AA4B2', fontSize: '1rem', marginBottom: '8px' }}>{profile.headline || 'No headline'}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div style={{ fontWeight: 500, color: '#9AA4B2', marginBottom: 4 }}>Email</div>
              <div style={{ color: '#FFFFFF' }}>{profile.email || '—'}</div>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: '#9AA4B2', marginBottom: 4 }}>Phone</div>
              <div style={{ color: '#FFFFFF' }}>{profile.phone || '—'}</div>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: '#9AA4B2', marginBottom: 4 }}>Location</div>
              <div style={{ color: '#FFFFFF' }}>{profile.location || '—'}</div>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: '#9AA4B2', marginBottom: 4 }}>Website</div>
              <div style={{ color: '#FFFFFF' }}>{profile.website || '—'}</div>
            </div>
          </div>
          {profile.summary && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, color: '#9AA4B2', marginBottom: 4 }}>Summary</div>
              <p style={{ color: '#FFFFFF' }}>{profile.summary}</p>
            </div>
          )}
        </div>
      </div>
      {/* Experience */}
      <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', boxShadow: '0 0 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(25px)' }}>
        <div style={{ padding: '24px' }}>
          <h3 style={{ color: '#FFFFFF', fontWeight: 600 }}>Experience</h3>
          {experiences.length > 0 ? experiences.map((exp: any) => (
            <div key={exp.id} style={{ marginBottom: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
              <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{exp.title || '—'}</div>
              <div style={{ fontWeight: 500, color: '#9AA4B2' }}>{exp.company || '—'}</div>
              {exp.location && <div style={{ color: '#9AA4B2' }}>{exp.location}</div>}
              <div style={{ color: '#9AA4B2' }}>{fmtDate(exp.start_date)} — {exp.is_current ? 'Present' : fmtDate(exp.end_date)}</div>
              {exp.description && <p style={{ marginTop: 8, color: '#9AA4B2' }}>{exp.description}</p>}
            </div>
          )) : <p style={{ color: '#9AA4B2' }}>No experience added yet.</p>}
        </div>
      </div>
      {/* Education */}
      <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', boxShadow: '0 0 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(25px)' }}>
        <div style={{ padding: '24px' }}>
          <h3 style={{ color: '#FFFFFF', fontWeight: 600 }}>Education</h3>
          {education.length > 0 ? education.map((edu: any) => (
            <div key={edu.id} style={{ marginBottom: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
              <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{edu.school || '—'}</div>
              <div style={{ color: '#9AA4B2' }}>{edu.degree || ''}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</div>
              <div style={{ color: '#9AA4B2' }}>{edu.start_year || ''} - {edu.end_year || ''}</div>
              {edu.description && <p style={{ marginTop: 8, color: '#9AA4B2' }}>{edu.description}</p>}
            </div>
          )) : <p style={{ color: '#9AA4B2' }}>No education added yet.</p>}
        </div>
      </div>
      {/* Skills */}
      <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', boxShadow: '0 0 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(25px)' }}>
        <div style={{ padding: '24px' }}>
          <h3 style={{ color: '#FFFFFF', fontWeight: 600 }}>Skills</h3>
          {skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.map((skill: any) => (
                <span key={skill.id} style={{ padding: '6px 12px', borderRadius: 12, background: 'rgba(79,241,227,0.15)', color: '#4ff1e3', border: '1px solid rgba(79,241,227,0.3)', fontSize: 14 }}>{skill.skill}</span>
              ))}
            </div>
          ) : <p style={{ color: '#9AA4B2' }}>No skills added yet.</p>}
        </div>
      </div>
      {/* Certifications, Memberships, Voluntary (optional) */}
      {/* Add similar blocks if needed */}
    </div>
  );
};
