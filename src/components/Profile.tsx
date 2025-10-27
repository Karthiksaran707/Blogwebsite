import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, uploadFile } from '../utils/api';
import { PostCard } from './PostCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardHeader } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Edit, Save, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  createdAt: string;
  image?: string;
  tags?: string[];
  categories?: string[];
  status?: string;
}

export function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setUsername(user.username || '');
    setEmail(user.email || '');
    setBio(user.bio || '');
    setAvatarPreview(user.avatar || '');
    loadUserPosts();
  }, [user]);

  async function loadUserPosts() {
    if (!user) return;

    try {
      setLoading(true);
      const posts = await apiCall('/posts');
      const myPosts = posts.filter((p: Post) => p.authorName === user.username);
      setUserPosts(myPosts);
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    try {
      setSaving(true);

      let avatarUrl = user?.avatar || '';
      if (avatarFile) {
        const result = await uploadFile(avatarFile);
        avatarUrl = result.url;
      }

      await updateUser({
        username,
        email,
        bio,
        avatar: avatarUrl
      });

      setEditing(false);
      setAvatarFile(null);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setBio(user.bio || '');
      setAvatarPreview(user.avatar || '');
      setAvatarFile(null);
    }
    setEditing(false);
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiCall(`/posts/${postId}`, { method: 'DELETE' });
      setUserPosts(userPosts.filter(p => p.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error: any) {
      console.error('Delete post error:', error);
      toast.error(error.message || 'Failed to delete post');
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarPreview} alt={username} />
                <AvatarFallback className="text-2xl">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {editing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-lg"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-gray-900 mb-2">{username}</h1>
                  <p className="text-gray-600 mb-4">{email}</p>
                  {bio && (
                    <p className="text-gray-700 max-w-2xl">{bio}</p>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {editing ? (
                <>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList>
          <TabsTrigger value="posts">
            My Posts ({userPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {loading ? (
            <p className="text-center text-gray-600 py-8">Loading posts...</p>
          ) : userPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPosts.map(post => (
                <div key={post.id} className="relative group">
                  <PostCard post={post} />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/edit/${post.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {post.status === 'draft' && (
                    <div className="absolute top-4 left-4">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
                        Draft
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">You haven't created any posts yet</p>
              <Button onClick={() => navigate('/create')}>
                Create Your First Post
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
