import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { apiCall } from '../utils/api';
import { PostCard } from './PostCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { useSearchParams } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  createdAt: string;
  image?: string;
  tags?: string[];
  categories?: string[];
  featured?: boolean;
}

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedTag]);

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([
        loadPosts(),
        loadFeaturedPosts(),
        loadCategories(),
        loadTags()
      ]);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPosts() {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedTag) params.append('tag', selectedTag);

      const data = await apiCall(`/posts?${params.toString()}`);
      setPosts(data);

      // Update URL
      const newParams: any = {};
      if (searchTerm) newParams.q = searchTerm;
      if (selectedCategory) newParams.category = selectedCategory;
      if (selectedTag) newParams.tag = selectedTag;
      setSearchParams(newParams);
    } catch (error) {
      console.error('Load posts error:', error);
    }
  }

  async function loadFeaturedPosts() {
    try {
      const data = await apiCall('/posts?featured=true');
      setFeaturedPosts(data.slice(0, 3));
    } catch (error) {
      console.error('Load featured posts error:', error);
    }
  }

  async function loadCategories() {
    try {
      const data = await apiCall('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Load categories error:', error);
    }
  }

  async function loadTags() {
    try {
      const data = await apiCall('/tags');
      setTags(data);
    } catch (error) {
      console.error('Load tags error:', error);
    }
  }

  function clearFilters() {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedTag('');
    setSearchParams({});
  }

  const hasFilters = searchTerm || selectedCategory || selectedTag;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Featured Posts Section */}
      {!hasFilters && featuredPosts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-gray-900 mb-6">Featured Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Search Bar */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 mb-4">Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
              {categories.length === 0 && (
                <p className="text-gray-500 text-sm">No categories yet</p>
              )}
            </div>
          </div>

          {/* Tags Filter */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 mb-4">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 15).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                >
                  {tag}
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-gray-500 text-sm">No tags yet</p>
              )}
            </div>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </aside>

        {/* Posts Grid */}
        <div className="lg:col-span-3">
          <div className="mb-6">
            <h2 className="text-gray-900">
              {hasFilters ? 'Search Results' : 'Recent Posts'}
            </h2>
            {hasFilters && (
              <p className="text-gray-600 mt-2">
                Found {posts.length} post{posts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-video" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No posts found</p>
              {hasFilters && (
                <Button onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
