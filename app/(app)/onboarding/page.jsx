'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  useEffect(() => {
    async function checkAuth() {
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

      if (userData?.onboarding_done) {
        router.push('/feed');
        return;
      }

      setCurrentUser(user);
      setLoading(false);
    }

    checkAuth();
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

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !college.trim() || !branch.trim() || !year) {
        toast.error('Please fill all fields');
        return;
      }
    }
    if (step === 2) {
      if (!bio.trim()) {
        toast.error('Please write a short bio');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
  if (!lookingFor) {
    toast.error('Please select what you&apos;re looking for');
    return;
  }

  setSubmitting(true);

  try {
    // Verify session is still valid
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Session expired');
      router.push('/login');
      return;
    }

    // Don't send user_id - the API gets it from the authenticated session
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
        looking_for: [lookingFor],
        onboarding_done: true
      })
    });

    const result = await response.json();

    if (response.ok) {
      toast.success('Welcome to ClanSko!');
      window.location.href = '/feed';
    } else {
      console.error('API Error:', result);
      toast.error(result.error || 'Failed to save profile');
    }
  } catch (error) {
    console.error('Submission error:', error);
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%'
      }}>
        
        {/* Progress Bar */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                flex: 1,
                height: '4px',
                background: s <= step ? '#F97316' : '#1E1E1E',
                borderRadius: '2px',
                transition: 'background 0.3s'
              }}></div>
            ))}
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#9A9A8A',
            textAlign: 'center'
          }}>
            Step {step} of 3
          </div>
        </div>

        {/* Card Container */}
        <div style={{
          background: '#161616',
          border: '1px solid #1E1E1E',
          borderRadius: '12px',
          padding: '40px'
        }}>
          
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              {/* Orange accent bar */}
              <div style={{
                width: '28px',
                height: '3px',
                background: '#F97316',
                borderRadius: '2px',
                marginBottom: '16px'
              }}></div>

              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '32px',
                fontWeight: '400',
                fontStyle: 'italic',
                color: '#F5F0E8',
                marginBottom: '8px'
              }}>
                Let&apos;s get started
              </h2>

              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                color: '#9A9A8A',
                marginBottom: '32px'
              }}>
                Tell us about yourself
              </p>

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
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
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
                    College
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
                      Branch
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
                      Year
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

              <button
                onClick={handleNext}
                style={{
                  width: '100%',
                  background: '#F97316',
                  color: '#111111',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '32px'
                }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Bio & Skills */}
          {step === 2 && (
            <div>
              <div style={{
                width: '28px',
                height: '3px',
                background: '#F97316',
                borderRadius: '2px',
                marginBottom: '16px'
              }}></div>

              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '32px',
                fontWeight: '400',
                fontStyle: 'italic',
                color: '#F5F0E8',
                marginBottom: '8px'
              }}>
                Tell your story
              </h2>

              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                color: '#9A9A8A',
                marginBottom: '32px'
              }}>
                Help others understand who you are
              </p>

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
                    placeholder="What drives you? What are you building? What's your vision?"
                    rows={5}
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
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
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
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button
                  onClick={handleBack}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: '#9A9A8A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '8px',
                    padding: '14px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    background: '#F97316',
                    color: '#111111',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Looking For */}
          {step === 3 && (
            <div>
              <div style={{
                width: '28px',
                height: '3px',
                background: '#F97316',
                borderRadius: '2px',
                marginBottom: '16px'
              }}></div>

              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '32px',
                fontWeight: '400',
                fontStyle: 'italic',
                color: '#F5F0E8',
                marginBottom: '8px'
              }}>
                What are you here for?
              </h2>

              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                color: '#9A9A8A',
                marginBottom: '32px'
              }}>
                This helps us connect you with the right people
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { value: 'Co-founder', emoji: '🚀', desc: 'Find someone to build with' },
                  { value: 'Collaborator', emoji: '🤝', desc: 'Work together on projects' },
                  { value: 'Mentor', emoji: '🎓', desc: 'Learn from experienced builders' },
                  { value: 'Accountability Partner', emoji: '⚡', desc: 'Stay consistent with goals' },
                  { value: 'Just Exploring', emoji: '👀', desc: 'See what&apos;s happening' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLookingFor(option.value)}
                    style={{
                      background: lookingFor === option.value ? '#F9731610' : '#111111',
                      border: `1px solid ${lookingFor === option.value ? '#F97316' : '#2A2A2A'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{option.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '15px',
                          fontWeight: '600',
                          color: lookingFor === option.value ? '#F97316' : '#F5F0E8',
                          marginBottom: '2px'
                        }}>
                          {option.value}
                        </div>
                        <div style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '13px',
                          color: '#9A9A8A'
                        }}>
                          {option.desc}
                        </div>
                      </div>
                      {lookingFor === option.value && (
                        <span style={{ color: '#F97316', fontSize: '20px' }}>✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button
                  onClick={handleBack}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: '#9A9A8A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '8px',
                    padding: '14px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    background: '#F97316',
                    color: '#111111',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          color: '#6A6A5A'
        }}>
          Welcome to ClanSko — where builders find their tribe
        </div>
      </div>
    </div>
  );
}