import React, { useState, useEffect } from 'react';
import { MessageCircle, Heart, Trash2, Reply } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  parentId: string | null;
  likes: number;
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    try {
      setLoading(true);
      const data = await apiCall(`/comments/${postId}`);
      setComments(data);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment() {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const comment = await apiCall('/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId,
          content: newComment,
          parentId: null
        })
      });

      setComments([...comments, comment]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (error: any) {
      console.error('Add comment error:', error);
      toast.error(error.message || 'Failed to add comment');
    }
  }

  async function handleReply(parentId: string) {
    if (!user) {
      toast.error('Please login to reply');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    try {
      const comment = await apiCall('/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId,
          content: replyContent,
          parentId
        })
      });

      setComments([...comments, comment]);
      setReplyContent('');
      setReplyTo(null);
      toast.success('Reply added!');
    } catch (error: any) {
      console.error('Add reply error:', error);
      toast.error(error.message || 'Failed to add reply');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiCall(`/comments/${commentId}`, { method: 'DELETE' });
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error: any) {
      console.error('Delete comment error:', error);
      toast.error(error.message || 'Failed to delete comment');
    }
  }

  async function handleLikeComment(commentId: string) {
    try {
      const data = await apiCall(`/comments/${commentId}/like`, { method: 'POST' });
      setComments(comments.map(c => c.id === commentId ? { ...c, likes: data.likes } : c));
    } catch (error) {
      console.error('Like comment error:', error);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const topLevelComments = comments.filter(c => !c.parentId);
  const getReplies = (commentId: string) => comments.filter(c => c.parentId === commentId);

  function CommentItem({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
    const replies = getReplies(comment.id);
    const isOwner = user?.id === comment.userId;

    return (
      <div className={`${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={comment.avatar} alt={comment.username} />
            <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-900">{comment.username}</span>
                <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
              >
                <Heart className="h-4 w-4" />
                <span>{comment.likes || 0}</span>
              </button>
              {user && !isReply && (
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Reply className="h-4 w-4" />
                  <span>Reply</span>
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {/* Reply Form */}
            {replyTo === comment.id && (
              <div className="mt-4 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleReply(comment.id)}>
                    Post Reply
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="h-6 w-6 text-gray-700" />
        <h2 className="text-gray-900">
          Comments ({comments.length})
        </h2>
      </div>

      {/* Add Comment Form */}
      {user ? (
        <div className="mb-8">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={4}
              />
              <Button onClick={handleAddComment}>
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-gray-600">
            Please <a href="/login" className="text-blue-600 hover:underline">login</a> to comment
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading comments...</p>
        </div>
      ) : topLevelComments.length > 0 ? (
        <div>
          {topLevelComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
