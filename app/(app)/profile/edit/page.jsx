'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        setCurrentUser(userData);
        setName(userData.name || '');
        setCollege(userData.college || '');
        setBranch(userData.branch || '');
        setYear(userData.year || '');
        setBio(userData.bio || '');
        setSkills(userData.skills || []);
        setLookingFor(userData.looking_for?.[0] || '');
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleAddSkill = () => {
    if (skillInput.trim() && skills.length < 5) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim() || !college.trim() || !branch.trim() || !year) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          college,
          branch,
          year,
          bio,
          skills,
          looking_for: lookingFor ? [lookingFor] : []
        })
      });

      if (response.ok) {
        toast.success('Profile updated!');
        router.push(`/profile/${currentUser.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Something went wrong');
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          color: '#9A9A8A'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      paddingTop: '0',
      paddingLeft: '0',
      paddingRight: '0',
      paddingBottom: '80px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '28px',
            height: '3px',
            background: '#F97316',
            borderRadius: '2px',
            marginBottom: '16px'
          }}></div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '40px',
            fontWeight: '400',
            fontStyle: 'italic',
            color: '#F5F0E8',
            marginBottom: '8px'
          }}>
            Edit Profile
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            color: '#9A9A8A'
          }}>
            Update your information
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#161616',
          border: '1px solid #1E1E1E',
          borderRadius: '12px',
          padding: '32px'
        }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Basic Info Section */}
            <div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#F97316',
                fontWeight: '500',
                marginBottom: '16px'
              }}>
                Basic Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#9A9A8A',
                    marginBottom: '8px'
                  }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      width: '100%',
                      background: '#111111',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      padding: '12px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      color: '#F5F0E8'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#9A9A8A',
                    marginBottom: '8px'
                  }}>
                    College *
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g., IIT Delhi, NIT Trichy"
                    style={{
                      width: '100%',
                      background: '#111111',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      padding: '12px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      color: '#F5F0E8'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#9A9A8A',
                      marginBottom: '8px'
                    }}>
                      Branch *
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g., CSE"
                      style={{
                        width: '100%',
                        background: '#111111',
                        border: '1px solid #2A2A2A',
                        borderRadius: '8px',
                        padding: '12px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '14px',
                        color: '#F5F0E8'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#9A9A8A',
                      marginBottom: '8px'
                    }}>
                      Year *
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#111111',
                        border: '1px solid #2A2A2A',
                        borderRadius: '8px',
                        padding: '12px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '14px',
                        color: '#F5F0E8'
                      }}
                    >
                      <option value="">Select</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#1E1E1E' }}></div>

            {/* About Section */}
            <div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#F97316',
                fontWeight: '500',
                marginBottom: '16px'
              }}>
                About
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#9A9A8A',
                    marginBottom: '8px'
                  }}>
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={4}
                    style={{
                      width: '100%',
                      background: '#111111',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      padding: '12px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      color: '#F5F0E8',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#9A9A8A',
                    marginBottom: '8px'
                  }}>
                    Skills (Max 5)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="e.g., React, Python, Design"
                      disabled={skills.length >= 5}
                      style={{
                        flex: 1,
                        background: '#111111',
                        border: '1px solid #2A2A2A',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '14px',
                        color: '#F5F0E8'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      disabled={!skillInput.trim() || skills.length >= 5}
                      style={{
                        background: '#F97316',
                        color: '#111111',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: !skillInput.trim() || skills.length >= 5 ? 'not-allowed' : 'pointer',
                        opacity: !skillInput.trim() || skills.length >= 5 ? 0.5 : 1
                      }}
                    >
                      Add
                    </button>
                  </div>

                  {skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {skills.map((skill, index) => (
                        <div key={index} style={{
                          background: '#F9731610',
                          border: '1px solid #F9731640',
                          color: '#F97316',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(index)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#F97316',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: 0,
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#9A9A8A',
                    marginBottom: '8px'
                  }}>
                    Looking For
                  </label>
                  <select
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#111111',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      padding: '12px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      color: '#F5F0E8'
                    }}
                  >
                    <option value="">Select...</option>
                    <option value="Co-founder">Co-founder</option>
                    <option value="Collaborator">Collaborator</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Accountability Partner">Accountability Partner</option>
                    <option value="Just Exploring">Just Exploring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
              paddingTop: '24px',
              borderTop: '1px solid #1E1E1E'
            }}>
              <button
                type="button"
                onClick={() => router.push(`/profile/${currentUser.id}`)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: '#9A9A8A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  padding: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  background: '#F97316',
                  color: '#111111',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}