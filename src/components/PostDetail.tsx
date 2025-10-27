import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, User, Heart, Share2, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { CommentSection } from './CommentSection';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
  tags?: string[];
  categories?: string[];
  likes: number;
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  async function loadPost() {
    try {
      setLoading(true);
      const data = await apiCall(`/posts/${id}`);
      setPost(data);
    } catch (error) {
      console.error('Load post error:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  }

  async function handleLike() {
    if (!post) return;

    try {
      const data = await apiCall(`/posts/${post.id}/like`, { method: 'POST' });
      setPost({ ...post, likes: data.likes });
    } catch (error) {
      console.error('Like post error:', error);
    }
  }

  async function handleDelete() {
    if (!post || !confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiCall(`/posts/${post.id}`, { method: 'DELETE' });
      toast.success('Post deleted successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Delete post error:', error);
      toast.error(error.message || 'Failed to delete post');
    }
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const canEdit = user && post && (user.id === post.authorId || user.role === 'admin');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="w-full aspect-video mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-gray-900 mb-4">Post not found</h2>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Featured Image */}
      {post.image && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <ImageWithFallback
            src={post.image}
            alt={post.title}
            className="w-full aspect-video object-cover"
          />
        </div>
      )}

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-gray-900 mb-4">{post.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{post.authorName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{formatDate(post.createdAt)}</span>
          </div>
          {post.updatedAt !== post.createdAt && (
            <span className="text-sm text-gray-500">
              (Updated {formatDate(post.updatedAt)})
            </span>
          )}
        </div>

        {/* Categories and Tags */}
        {(post.categories && post.categories.length > 0) || (post.tags && post.tags.length > 0) ? (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.categories?.map(category => (
              <Badge key={category} variant="default">
                {category}
              </Badge>
            ))}
            {post.tags?.map(tag => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleLike}>
            <Heart className="h-4 w-4 mr-2" />
            {post.likes || 0}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/edit/${post.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Post Content */}
      <div className="post-content mb-12" dangerouslySetInnerHTML={{ __html: post.content }} />

      <hr className="my-12 border-gray-200" />

      {/* Comments Section */}
      <CommentSection postId={post.id} />
    </article>
  );
}
