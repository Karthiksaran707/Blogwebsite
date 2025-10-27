import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, Users, MessageCircle, Trash2, Shield, ShieldOff, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  totalPosts: number;
  totalUsers: number;
  totalComments: number;
  publishedPosts: number;
  draftPosts: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'post' | 'comment' | null;
    id: string;
    title: string;
  }>({ open: false, type: null, id: '', title: '' });
  const [roleDialog, setRoleDialog] = useState<{
    open: boolean;
    userId: string;
    username: string;
    currentRole: string;
  }>({ open: false, userId: '', username: '', currentRole: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      toast.error('Access denied - Admin only');
      navigate('/');
      return;
    }

    loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, postsData, usersData, commentsData] = await Promise.all([
        apiCall('/admin/stats'),
        apiCall('/posts'),
        apiCall('/admin/users'),
        apiCall('/admin/all-comments')
      ]);

      setStats(statsData);
      setPosts(postsData);
      setUsers(usersData);
      setComments(commentsData);
    } catch (error: any) {
      console.error('Load admin data error:', error);
      toast.error(error.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost() {
    try {
      await apiCall(`/posts/${deleteDialog.id}`, { method: 'DELETE' });
      setPosts(posts.filter(p => p.id !== deleteDialog.id));
      setDeleteDialog({ open: false, type: null, id: '', title: '' });
      toast.success('Post deleted successfully');
    } catch (error: any) {
      console.error('Delete post error:', error);
      toast.error(error.message || 'Failed to delete post');
    }
  }

  async function handleDeleteComment() {
    try {
      await apiCall(`/comments/${deleteDialog.id}`, { method: 'DELETE' });
      setComments(comments.filter(c => c.id !== deleteDialog.id));
      setDeleteDialog({ open: false, type: null, id: '', title: '' });
      toast.success('Comment deleted successfully');
    } catch (error: any) {
      console.error('Delete comment error:', error);
      toast.error(error.message || 'Failed to delete comment');
    }
  }

  async function handleChangeRole(newRole: string) {
    try {
      await apiCall(`/admin/users/${roleDialog.userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });

      setUsers(users.map(u => u.id === roleDialog.userId ? { ...u, role: newRole } : u));
      setRoleDialog({ open: false, userId: '', username: '', currentRole: '' });
      toast.success('User role updated successfully');
    } catch (error: any) {
      console.error('Update role error:', error);
      toast.error(error.message || 'Failed to update user role');
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  if (!user || user.role !== 'admin') return null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-gray-700">Total Posts</h3>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 text-3xl">{stats.totalPosts}</p>
              <p className="text-sm text-gray-600 mt-2">
                {stats.publishedPosts} published, {stats.draftPosts} drafts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-gray-700">Total Users</h3>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 text-3xl">{stats.totalUsers}</p>
              <p className="text-sm text-gray-600 mt-2">
                {users.filter(u => u.role === 'admin').length} admins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-gray-700">Total Comments</h3>
                <MessageCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 text-3xl">{stats.totalComments}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Tables */}
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-gray-900">All Posts</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map(post => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-xs truncate">
                          {post.title}
                        </TableCell>
                        <TableCell>{post.authorName}</TableCell>
                        <TableCell>
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(post.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/post/${post.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteDialog({
                                open: true,
                                type: 'post',
                                id: post.id,
                                title: post.title
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-gray-900">All Users</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRoleDialog({
                              open: true,
                              userId: u.id,
                              username: u.username,
                              currentRole: u.role
                            })}
                            disabled={u.id === user.id}
                          >
                            {u.role === 'admin' ? (
                              <ShieldOff className="h-4 w-4 mr-2" />
                            ) : (
                              <Shield className="h-4 w-4 mr-2" />
                            )}
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-gray-900">All Comments</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Post ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comments.map(comment => (
                      <TableRow key={comment.id}>
                        <TableCell className="max-w-xs truncate">
                          {comment.content}
                        </TableCell>
                        <TableCell>{comment.username}</TableCell>
                        <TableCell className="truncate max-w-[100px]">
                          {comment.postId}
                        </TableCell>
                        <TableCell>{formatDate(comment.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteDialog({
                              open: true,
                              type: 'comment',
                              id: comment.id,
                              title: comment.content.substring(0, 50)
                            })}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, id: '', title: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deleteDialog.type}: "{deleteDialog.title}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDialog.type === 'post' ? handleDeletePost : handleDeleteComment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <AlertDialog open={roleDialog.open} onOpenChange={(open) => !open && setRoleDialog({ open: false, userId: '', username: '', currentRole: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Change role for {roleDialog.username} from {roleDialog.currentRole} to{' '}
              {roleDialog.currentRole === 'admin' ? 'user' : 'admin'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleChangeRole(roleDialog.currentRole === 'admin' ? 'user' : 'admin')}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
