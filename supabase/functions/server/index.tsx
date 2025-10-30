import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Initialize storage bucket
const bucketName = 'make-cd7e5f90-blog-images';
const { data: buckets } = await supabase.storage.listBuckets();
const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
if (!bucketExists) {
  await supabase.storage.createBucket(bucketName, { public: false });
  console.log('Created private bucket:', bucketName);
}

// Helper to verify auth
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) return null;
  const accessToken = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}

// ============ AUTH ROUTES ============

app.post('/make-server-cd7e5f90/signup', async (c) => {
  try {
    const { email, password, username, avatar } = await c.req.json();
    
    if (!email || !password || !username) {
      return c.json({ error: 'Email, password, and username are required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      // Automatically confirm email since email server hasn't been configured
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Create user profile in KV
    const userId = data.user.id;
    await kv.set(`users:${userId}`, {
      id: userId,
      email,
      username,
      role: 'user',
      avatar: avatar || '',
      bio: '',
      createdAt: new Date().toISOString()
    });

    return c.json({ message: 'User created successfully', userId });
  } catch (err) {
    console.log('Signup error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.get('/make-server-cd7e5f90/user/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const userData = await kv.get(`users:${userId}`);
    
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(userData);
  } catch (err) {
    console.log('Get user error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.get('/make-server-cd7e5f90/user-by-email/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const users = await kv.getByPrefix('users:');
    const user = users.find((u: any) => u.email === email);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  } catch (err) {
    console.log('Get user by email error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.put('/make-server-cd7e5f90/user/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('id');
    if (user.id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updates = await c.req.json();
    const currentData = await kv.get(`users:${userId}`);
    
    if (!currentData) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updatedUser = { ...currentData, ...updates, id: userId };
    await kv.set(`users:${userId}`, updatedUser);

    return c.json(updatedUser);
  } catch (err) {
    console.log('Update user error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

// ============ POST ROUTES ============

app.get('/make-server-cd7e5f90/posts', async (c) => {
  try {
    const category = c.req.query('category');
    const search = c.req.query('search');
    const tag = c.req.query('tag');
    const featured = c.req.query('featured');
    
    let posts = await kv.getByPrefix('posts:');
    
    // Filter by status (only published posts for non-auth users)
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      posts = posts.filter((p: any) => p.status === 'published');
    }
    
    // Apply filters
    if (category) {
      posts = posts.filter((p: any) => p.categories?.includes(category));
    }
    if (tag) {
      posts = posts.filter((p: any) => p.tags?.includes(tag));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter((p: any) => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.content?.toLowerCase().includes(searchLower) ||
        p.excerpt?.toLowerCase().includes(searchLower)
      );
    }
    if (featured === 'true') {
      posts = posts.filter((p: any) => p.featured === true);
    }

    // Sort by creation date (newest first)
    posts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json(posts);
  } catch (err) {
    console.log('Get posts error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.get('/make-server-cd7e5f90/posts/:id', async (c) => {
  try {
    const postId = c.req.param('id');
    const post = await kv.get(`posts:${postId}`);
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json(post);
  } catch (err) {
    console.log('Get post error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post('/make-server-cd7e5f90/posts', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized - please log in to create posts' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    const postData = await c.req.json();
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newPost = {
      id: postId,
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt || postData.content?.substring(0, 200),
      authorId: user.id,
      authorName: userData?.username || user.email,
      image: postData.image || '',
      tags: postData.tags || [],
      categories: postData.categories || [],
      status: postData.status || 'published',
      featured: postData.featured || false,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`posts:${postId}`, newPost);
    console.log('Post created successfully:', postId);

    return c.json(newPost);
  } catch (err) {
    console.log('Create post error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.put('/make-server-cd7e5f90/posts/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('id');
    const currentPost = await kv.get(`posts:${postId}`);
    
    if (!currentPost) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const userData = await kv.get(`users:${user.id}`);
    // Allow update if user is author or admin
    if (currentPost.authorId !== user.id && userData?.role !== 'admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updates = await c.req.json();
    const updatedPost = {
      ...currentPost,
      ...updates,
      id: postId,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`posts:${postId}`, updatedPost);
    console.log('Post updated successfully:', postId);

    return c.json(updatedPost);
  } catch (err) {
    console.log('Update post error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.delete('/make-server-cd7e5f90/posts/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('id');
    const post = await kv.get(`posts:${postId}`);
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (post.authorId !== user.id && userData?.role !== 'admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await kv.del(`posts:${postId}`);
    console.log('Post deleted successfully:', postId);

    return c.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.log('Delete post error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post('/make-server-cd7e5f90/posts/:id/like', async (c) => {
  try {
    const postId = c.req.param('id');
    const post = await kv.get(`posts:${postId}`);
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    post.likes = (post.likes || 0) + 1;
    await kv.set(`posts:${postId}`, post);

    return c.json({ likes: post.likes });
  } catch (err) {
    console.log('Like post error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

// ============ COMMENT ROUTES ============

app.get('/make-server-cd7e5f90/comments/:postId', async (c) => {
  try {
    const postId = c.req.param('postId');
    const allComments = await kv.getByPrefix('comments:');
    const comments = allComments.filter((c: any) => c.postId === postId);
    
    // Sort by creation date (oldest first)
    comments.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return c.json(comments);
  } catch (err) {
    console.log('Get comments error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post('/make-server-cd7e5f90/comments', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized - please log in to comment' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    const { postId, content, parentId } = await c.req.json();
    
    if (!postId || !content) {
      return c.json({ error: 'Post ID and content are required' }, 400);
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newComment = {
      id: commentId,
      postId,
      userId: user.id,
      username: userData?.username || user.email,
      avatar: userData?.avatar || '',
      content,
      parentId: parentId || null,
      likes: 0,
      createdAt: new Date().toISOString()
    };

    await kv.set(`comments:${commentId}`, newComment);
    console.log('Comment created successfully:', commentId);

    return c.json(newComment);
  } catch (err) {
    console.log('Create comment error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.delete('/make-server-cd7e5f90/comments/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const commentId = c.req.param('id');
    const comment = await kv.get(`comments:${commentId}`);
    
    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (comment.userId !== user.id && userData?.role !== 'admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await kv.del(`comments:${commentId}`);
    console.log('Comment deleted successfully:', commentId);

    return c.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.log('Delete comment error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post('/make-server-cd7e5f90/comments/:id/like', async (c) => {
  try {
    const commentId = c.req.param('id');
    const comment = await kv.get(`comments:${commentId}`);
    
    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    comment.likes = (comment.likes || 0) + 1;
    await kv.set(`comments:${commentId}`, comment);

    return c.json({ likes: comment.likes });
  } catch (err) {
    console.log('Like comment error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

// ============ ADMIN ROUTES ============

app.get('/make-server-cd7e5f90/admin/stats', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (userData?.role !== 'admin') {
      return c.json({ error: 'Forbidden - admin access only' }, 403);
    }

    const posts = await kv.getByPrefix('posts:');
    const users = await kv.getByPrefix('users:');
    const comments = await kv.getByPrefix('comments:');

    return c.json({
      totalPosts: posts.length,
      totalUsers: users.length,
      totalComments: comments.length,
      publishedPosts: posts.filter((p: any) => p.status === 'published').length,
      draftPosts: posts.filter((p: any) => p.status === 'draft').length
    });
  } catch (err) {
    console.log('Get admin stats error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.get('/make-server-cd7e5f90/admin/users', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (userData?.role !== 'admin') {
      return c.json({ error: 'Forbidden - admin access only' }, 403);
    }

    const users = await kv.getByPrefix('users:');
    return c.json(users);
  } catch (err) {
    console.log('Get users error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.put('/make-server-cd7e5f90/admin/users/:id/role', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (userData?.role !== 'admin') {
      return c.json({ error: 'Forbidden - admin access only' }, 403);
    }

    const targetUserId = c.req.param('id');
    const { role } = await c.req.json();
    
    const targetUser = await kv.get(`users:${targetUserId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    targetUser.role = role;
    await kv.set(`users:${targetUserId}`, targetUser);
    console.log('User role updated:', targetUserId, role);

    return c.json(targetUser);
  } catch (err) {
    console.log('Update user role error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.get('/make-server-cd7e5f90/admin/all-comments', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (userData?.role !== 'admin') {
      return c.json({ error: 'Forbidden - admin access only' }, 403);
    }

    const comments = await kv.getByPrefix('comments:');
    return c.json(comments);
  } catch (err) {
    console.log('Get all comments error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

// ============ IMAGE UPLOAD ROUTE ============

app.post('/make-server-cd7e5f90/upload', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size too large (max 5MB)' }, 400);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.log('Upload error:', error);
      return c.json({ error: error.message }, 500);
    }

    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000);

    return c.json({ url: urlData?.signedUrl });
  } catch (err) {
    console.log('Upload error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

// ============ CATEGORIES ROUTE ============

app.get('/make-server-cd7e5f90/categories', async (c) => {
  try {
    const posts = await kv.getByPrefix('posts:');
    const categoriesSet = new Set<string>();
    
    posts.forEach((post: any) => {
      if (post.categories) {
        post.categories.forEach((cat: string) => categoriesSet.add(cat));
      }
    });

    return c.json(Array.from(categoriesSet).sort());
  } catch (err) {
    console.log('Get categories error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

app.get('/make-server-cd7e5f90/tags', async (c) => {
  try {
    const posts = await kv.getByPrefix('posts:');
    const tagsSet = new Set<string>();
    
    posts.forEach((post: any) => {
      if (post.tags) {
        post.tags.forEach((tag: string) => tagsSet.add(tag));
      }
    });

    return c.json(Array.from(tagsSet).sort());
  } catch (err) {
    console.log('Get tags error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

Deno.serve(app.fetch);
