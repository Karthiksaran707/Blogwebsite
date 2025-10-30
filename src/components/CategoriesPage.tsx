import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { PostCard } from './PostCard';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { FolderOpen } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  createdAt: string;
  image?: string;
  tags?: string[];
  categories?: string[];
}

export function CategoriesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [categories, setCategories] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  async function loadData() {
    try {
      setLoading(true);
      const [categoriesData, postsData] = await Promise.all([
        apiCall('/categories'),
        selectedCategory ? apiCall(`/posts?category=${selectedCategory}`) : Promise.resolve([])
      ]);

      setCategories(categoriesData);
      setPosts(postsData);
    } catch (error) {
      console.error('Load categories error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryClick(category: string) {
    navigate(`/categories?category=${encodeURIComponent(category)}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Categories</h1>
        <p className="text-gray-600">
          Browse posts by category
        </p>
      </div>

      {/* Categories Grid */}
      {!selectedCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {categories.map(category => (
            <Card
              key={category}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-900">{category}</h3>
                </div>
              </div>
            </Card>
          ))}
          {categories.length === 0 && !loading && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No categories yet</p>
            </div>
          )}
        </div>
      )}

      {/* Posts for Selected Category */}
      {selectedCategory && (
        <div>
          <div className="mb-6 flex items-center space-x-4">
            <button
              onClick={() => navigate('/categories')}
              className="text-blue-600 hover:underline"
            >
              ← Back to all categories
            </button>
            <Badge className="text-lg px-4 py-2">{selectedCategory}</Badge>
          </div>

          {loading ? (
            <p className="text-center text-gray-600 py-8">Loading posts...</p>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts in this category yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
