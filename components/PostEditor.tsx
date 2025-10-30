import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, uploadFile } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { X, Upload, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { RichTextEditor } from './RichTextEditor';

export function PostEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (id) {
      loadPost();
    }
  }, [id, user]);

  async function loadPost() {
    if (!id) return;

    try {
      setLoading(true);
      const post = await apiCall(`/posts/${id}`);
      
      if (user && post.authorId !== user.id && user.role !== 'admin') {
        toast.error('You do not have permission to edit this post');
        navigate('/');
        return;
      }

      setTitle(post.title || '');
      setContent(post.content || '');
      setCategories(post.categories || []);
      setTags(post.tags || []);
      setImage(post.image || '');
      setImagePreview(post.image || '');
      setStatus(post.status || 'published');
    } catch (error) {
      console.error('Load post error:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadImage() {
    if (!imageFile) return image;

    try {
      setUploading(true);
      const result = await uploadFile(imageFile);
      setImage(result.url);
      return result.url;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      throw error;
    } finally {
      setUploading(false);
    }
  }

  function addCategory() {
    const cat = categoryInput.trim();
    if (cat && !categories.includes(cat)) {
      setCategories([...categories, cat]);
      setCategoryInput('');
    }
  }

  function removeCategory(cat: string) {
    setCategories(categories.filter(c => c !== cat));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  async function handleSave(saveStatus: 'draft' | 'published') {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      setSaving(true);

      // Upload image if new file selected
      let imageUrl = image;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Create plain text excerpt from HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      const postData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: plainText.trim().substring(0, 200),
        categories,
        tags,
        image: imageUrl,
        status: saveStatus
      };

      let result;
      if (id) {
        result = await apiCall(`/posts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(postData)
        });
        toast.success('Post updated successfully!');
      } else {
        result = await apiCall('/posts', {
          method: 'POST',
          body: JSON.stringify(postData)
        });
        toast.success('Post created successfully!');
      }

      navigate(`/post/${result.id}`);
    } catch (error: any) {
      console.error('Save post error:', error);
      toast.error(error.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-gray-900">Preview</h2>
          <Button onClick={() => setShowPreview(false)}>
            <X className="h-4 w-4 mr-2" />
            Close Preview
          </Button>
        </div>

        <Card>
          {imagePreview && (
            <div className="aspect-video overflow-hidden bg-gray-200">
              <ImageWithFallback
                src={imagePreview}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <h1 className="text-gray-900">{title || 'Untitled Post'}</h1>
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map(cat => (
                <Badge key={cat}>{cat}</Badge>
              ))}
              {tags.map(tag => (
                <Badge key={tag} variant="secondary">#{tag}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="post-content" dangerouslySetInnerHTML={{ __html: content || '<p>No content yet...</p>' }} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-gray-900">
          {id ? 'Edit Post' : 'Create New Post'}
        </h1>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            className="mt-2"
          />
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content">Content *</Label>
          <div className="mt-2">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write your post content here..."
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Rich text editor with formatting, images, and more
          </p>
        </div>

        {/* Featured Image */}
        <div>
          <Label htmlFor="image">Featured Image</Label>
          <div className="mt-2 space-y-4">
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1"
              />
              {uploading && <span className="text-sm text-gray-600">Uploading...</span>}
            </div>
            {imagePreview && (
              <div className="relative w-full max-w-md aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setImage('');
                  }}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label htmlFor="category">Categories</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="category"
              type="text"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              placeholder="Add a category..."
            />
            <Button type="button" onClick={addCategory} variant="outline">
              Add
            </Button>
          </div>
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map(cat => (
                <Badge key={cat} className="cursor-pointer" onClick={() => removeCategory(cat)}>
                  {cat}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <Label htmlFor="tag">Tags</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="tag"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
            />
            <Button type="button" onClick={addTag} variant="outline">
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  #{tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-6 border-t">
          <Button
            onClick={() => handleSave('published')}
            disabled={saving || uploading}
          >
            <Save className="h-4 w-4 mr-2" />
            {id ? 'Update' : 'Publish'}
          </Button>
          <Button
            onClick={() => handleSave('draft')}
            variant="outline"
            disabled={saving || uploading}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => setShowPreview(true)}
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
