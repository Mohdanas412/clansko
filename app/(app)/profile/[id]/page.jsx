'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id;

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [pendingConnectionId, setPendingConnectionId] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: currentUserData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentUser(currentUserData);

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', profileId)
        .single();

      if (!profileData) {
        toast.error('User not found');
        router.push('/explore');
        return;
      }

      setProfileUser(profileData);

      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          users (name, profile_photo),
          reactions (id, type),
          comments (id)
        `)
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      setUserPosts(postsData || []);

      if (user.id !== profileId) {
        const { data: connection } = await supabase
          .from('connections')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user.id})`)
          .maybeSingle();

        if (connection) {
          setConnectionStatus(connection.status);
          setPendingConnectionId(connection.id);
        }
      }

      setLoading(false);
    }

    init();
  }, [profileId, supabase, router]);

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: profileId,
          message: `Hi ${profileUser.name}, I&apos;d like to connect!`
        })
      });

      if (response.ok) {
        setConnectionStatus('pending');
        toast.success('Connection request sent!');
      } else {
        toast.error('Failed to send request');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setConnectLoading(false);
  };

  const handleAccept = async () => {
    setConnectLoading(true);
    try {
      const response = await fetch('/api/connections/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: pendingConnectionId,
          action: 'accept'
        })
      });

      if (response.ok) {
        setConnectionStatus('accepted');
        toast.success('Connection accepted!');
      } else {
        toast.error('Failed to accept');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setConnectLoading(false);
  };

  const handleMessage = () => {
    router.push(`/messages/${pendingConnectionId}`);
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#111111',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header skeleton */}
          <div style={{
            background: '#161616',
            border: '1px solid #1E1E1E',
            borderRadius: '12px',
            padding: '40px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '12px',
                background: '#1E1E1E'
              }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ width: '200px', height: '28px', background: '#1E1E1E', borderRadius: '4px', marginBottom: '12px' }}></div>
                <div style={{ width: '300px', height: '20px', background: '#1E1E1E', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div style={{ width: '150px', height: '20px', background: '#1E1E1E', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileId;
  const reactionCount = userPosts.reduce((sum, post) => sum + (post.reactions?.length || 0), 0);
  const commentCount = userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#111111',
      paddingBottom: '80px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        
        {/* Profile Header Card */}
        <div style={{
          background: '#161616',
          border: '1px solid #1E1E1E',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            
            {/* Avatar */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '12px',
              background: profileUser.profile_photo ? 'transparent' : '#F9731620',
              border: `2px solid ${profileUser.profile_photo ? '#2A2A2A' : '#F9731640'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: '600',
              color: '#F97316',
              flexShrink: 0,
              overflow: 'hidden'
            }}>
              {profileUser.profile_photo ? (
                <img 
                  src={profileUser.profile_photo} 
                  alt={profileUser.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                profileUser.name?.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '28px',
                fontWeight: '600',
                color: '#F5F0E8',
                marginBottom: '8px'
              }}>
                {profileUser.name}
              </h1>
              
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                flexWrap: 'wrap',
                marginBottom: '16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#9A9A8A'
              }}>
                <span>{profileUser.college}</span>
                <span>•</span>
                <span>{profileUser.branch}</span>
                <span>•</span>
                <span>{profileUser.year} Year</span>
              </div>

              {profileUser.bio && (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  lineHeight: '1.6',
                  color: '#F5F0E8',
                  marginBottom: '20px',
                  maxWidth: '600px'
                }}>
                  {profileUser.bio}
                </p>
              )}

              {/* Stats */}
              <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
                <div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#F97316'
                  }}>
                    {userPosts.length}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#6A6A5A',
                    fontWeight: '500'
                  }}>
                    Posts
                  </div>
                </div>
                <div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#F97316'
                  }}>
                    {reactionCount}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#6A6A5A',
                    fontWeight: '500'
                  }}>
                    Reactions
                  </div>
                </div>
                <div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#F97316'
                  }}>
                    {commentCount}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#6A6A5A',
                    fontWeight: '500'
                  }}>
                    Comments
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {isOwnProfile ? (
                  <button
                    onClick={() => router.push('/profile/edit')}
                    style={{
                      background: '#F97316',
                      color: '#111111',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    {connectionStatus === 'accepted' ? (
                      <button
                        onClick={handleMessage}
                        style={{
                          background: '#F97316',
                          color: '#111111',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 20px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Message
                      </button>
                    ) : connectionStatus === 'pending' ? (
                      <>
                        {pendingConnectionId && (
                          <>
                            <button
                              onClick={handleAccept}
                              disabled={connectLoading}
                              style={{
                                background: '#F97316',
                                color: '#111111',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: connectLoading ? 'not-allowed' : 'pointer',
                                opacity: connectLoading ? 0.6 : 1
                              }}
                            >
                              {connectLoading ? 'Accepting...' : 'Accept Request'}
                            </button>
                            <button
                              disabled
                              style={{
                                background: 'transparent',
                                color: '#9A9A8A',
                                border: '1px solid #2A2A2A',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'not-allowed'
                              }}
                            >
                              Pending
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={handleConnect}
                        disabled={connectLoading}
                        style={{
                          background: '#F97316',
                          color: '#111111',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 20px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: connectLoading ? 'not-allowed' : 'pointer',
                          opacity: connectLoading ? 0.6 : 1
                        }}
                      >
                        {connectLoading ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '24px',
          borderBottom: '1px solid #1E1E1E'
        }}>
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '12px 0',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === 'posts' ? '#F97316' : '#9A9A8A',
              borderBottom: activeTab === 'posts' ? '2px solid #F97316' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >
            Posts ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '12px 0',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === 'about' ? '#F97316' : '#9A9A8A',
              borderBottom: activeTab === 'about' ? '2px solid #F97316' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >
            About
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {userPosts.length === 0 ? (
              <div style={{
                background: '#161616',
                border: '1px solid #1E1E1E',
                borderRadius: '12px',
                padding: '60px 24px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  color: '#9A9A8A'
                }}>
                  No posts yet
                </div>
              </div>
            ) : (
              userPosts.map(post => (
                <PostCard key={post.id} post={post} currentUser={currentUser} />
              ))
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Skills */}
            {profileUser.skills && profileUser.skills.length > 0 && (
              <div style={{
                background: '#161616',
                border: '1px solid #1E1E1E',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#F97316',
                  fontWeight: '500',
                  marginBottom: '16px'
                }}>
                  Skills
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profileUser.skills.map((skill, idx) => (
                    <span key={idx} style={{
                      background: '#F9731610',
                      border: '1px solid #F9731640',
                      color: '#F97316',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: '500'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Looking For */}
            {profileUser.looking_for && profileUser.looking_for.length > 0 && (
              <div style={{
                background: '#161616',
                border: '1px solid #1E1E1E',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#F97316',
                  fontWeight: '500',
                  marginBottom: '16px'
                }}>
                  Looking For
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profileUser.looking_for.map((item, idx) => (
                    <span key={idx} style={{
                      background: '#F9731610',
                      border: '1px solid #F9731640',
                      color: '#F97316',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: '500'
                    }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, currentUser }) {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [reactions, setReactions] = useState(post.reactions || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userReaction = reactions.find(r => r.user_id === currentUser?.id);

  const handleReact = async (type) => {
    const response = await fetch('/api/posts/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: post.id,
        type
      })
    });

    if (response.ok) {
      const { data } = await response.json();
      if (data.action === 'added') {
        setReactions([...reactions, { id: data.id, type, user_id: currentUser.id }]);
      } else {
        setReactions(reactions.filter(r => r.user_id !== currentUser.id));
      }
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    const response = await fetch('/api/posts/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: post.id,
        content: commentText
      })
    });

    if (response.ok) {
      const { data } = await response.json();
      setComments([...comments, data]);
      setCommentText('');
      toast.success('Comment added');
    }
    setSubmitting(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 7) return date.toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div style={{
      background: '#161616',
      border: '1px solid #1E1E1E',
      borderRadius: '12px',
      padding: '24px',
      transition: 'border-color 0.2s'
    }}>
      {/* Post Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: post.users?.profile_photo ? 'transparent' : '#F9731620',
          border: `2px solid ${post.users?.profile_photo ? '#2A2A2A' : '#F9731640'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: '600',
          color: '#F97316',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {post.users?.profile_photo ? (
            <img src={post.users.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            post.users?.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
            color: '#F5F0E8'
          }}>
            {post.users?.name}
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            color: '#6A6A5A'
          }}>
            {formatDate(post.created_at)}
          </div>
        </div>
        {post.stage && (
          <span style={{
            background: '#F9731610',
            border: '1px solid #F9731640',
            color: '#F97316',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>
            {post.stage}
          </span>
        )}
      </div>

      {/* Post Content */}
      <h3 style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '18px',
        fontWeight: '600',
        color: '#F5F0E8',
        marginBottom: '8px'
      }}>
        {post.title}
      </h3>

      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#9A9A8A',
        marginBottom: '16px'
      }}>
        {post.description}
      </p>

      {post.looking_for && post.looking_for.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {post.looking_for.map((item, idx) => (
            <span key={idx} style={{
              background: '#F9731610',
              border: '1px solid #F9731640',
              color: '#F97316',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: '500'
            }}>
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #1E1E1E'
      }}>
        <button
          onClick={() => handleReact('fire')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            fontWeight: '500',
            color: userReaction ? '#F97316' : '#9A9A8A',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          <span style={{ fontSize: '16px' }}>🔥</span>
          {reactions.length > 0 && reactions.length}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            fontWeight: '500',
            color: '#9A9A8A',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          <span style={{ fontSize: '16px' }}>💬</span>
          {comments.length > 0 && comments.length}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #1E1E1E'
        }}>
          <form onSubmit={handleComment} style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              style={{
                width: '100%',
                background: '#111111',
                border: '1px solid #2A2A2A',
                borderRadius: '6px',
                padding: '10px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#F5F0E8',
                marginBottom: '8px'
              }}
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              style={{
                background: '#F97316',
                color: '#111111',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting || !commentText.trim() ? 0.5 : 1
              }}
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </form>

          {comments.map((comment) => (
            <div key={comment.id} style={{
              background: '#111111',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px'
            }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: '600',
                color: '#F5F0E8',
                marginBottom: '4px'
              }}>
                {comment.users?.name || 'User'}
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#9A9A8A'
              }}>
                {comment.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}