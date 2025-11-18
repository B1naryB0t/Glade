// Update to the api.js service to fix user info and location issues

export const api = {
  // Mock data store (to persist data between calls)
  _mockData: {
    currentUser: {
      id: 1,
      username: 'demo_user',
      email: 'demo@example.com',
      bio: 'This is a demo user profile for testing.',
      created_at: '2023-01-01T00:00:00Z',
      location: {
        city: 'New York City', // Default setting
        region: 'New York'
      },
      settings: {
        profile_visibility: 'public',
        default_post_privacy: 'followers', // Default setting
        email_notifications: true,
        browser_notifications: false
      }
    },
    users: [
      {
        id: 2,
        username: 'john_doe',
        email: 'john@example.com',
        bio: 'Just a regular user',
        created_at: '2023-02-15T00:00:00Z',
        location: {
          city: 'New York',
          region: 'NY'
        },
        followers_count: 25,
        following_count: 12,
        posts_count: 5,
        is_followed: false
      },
      {
        id: 3,
        username: 'jane_smith',
        email: 'jane@example.com',
        bio: 'Developer and designer',
        created_at: '2023-03-20T00:00:00Z',
        location: {
          city: 'San Francisco',
          region: 'CA'
        },
        followers_count: 42,
        following_count: 30,
        posts_count: 12,
        is_followed: true
      }
    ],
    posts: [
      {
        id: 1,
        content: 'This is a post from John Doe!',
        created_at: '2023-09-25T10:30:00Z',
        city: 'New York',
        region: 'NY',
        visibility: 'public',
        likes_count: 8,
        liked_by_current_user: false,
        user: {
          id: 2,
          username: 'john_doe'
        },
        comments: [
          {
            id: 101,
            content: 'Great post, John!',
            created_at: '2023-09-25T11:00:00Z',
            user: {
              id: 1,
              username: 'demo_user'
            }
          }
        ]
      },
      {
        id: 2,
        content: 'Just learned a new design pattern today!',
        created_at: '2023-09-24T08:15:00Z',
        city: 'San Francisco',
        region: 'CA',
        visibility: 'followers',
        likes_count: 12,
        liked_by_current_user: true,
        user: {
          id: 3,
          username: 'jane_smith'
        },
        comments: [
          {
            id: 201,
            content: 'Which pattern did you learn?',
            created_at: '2023-09-24T09:30:00Z',
            user: {
              id: 1,
              username: 'demo_user'
            }
          },
          {
            id: 202,
            content: 'Ive been studying those too!',
            created_at: '2023-09-24T10:45:00Z',
            user: {
              id: 2,
              username: 'john_doe'
            }
          }
        ]
      }
    ]
  },
  
  // Helper functions
  _generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  },
  
  // Get user profile
  async getUserProfile(userId) {
    console.log('Getting profile for user:', userId);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // For 'me' or current user's ID, return the current user
    if (userId === 'me' || userId === '1' || userId === 1) {
      return { ...this._mockData.currentUser };
    }
    
    // For other users, find them in the users array
    const user = this._mockData.users.find(u => u.id.toString() === userId.toString());
    
    // If user not found, create a mock user
    if (!user) {
      return {
        id: parseInt(userId),
        username: `user_${userId}`,
        email: `user${userId}@example.com`,
        bio: `This is user ${userId}'s profile.`,
        created_at: '2023-01-01T00:00:00Z',
        location: {
          city: 'Mock City',
          region: 'Mock Region'
        },
        followers_count: Math.floor(Math.random() * 100),
        following_count: Math.floor(Math.random() * 50),
        posts_count: 2,
        is_followed: false
      };
    }
    
    return { ...user };
  },
  
  // Get user settings
  async getUserSettings() {
    console.log('Getting user settings');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return the current user's settings
    return {
      ...this._mockData.currentUser,
      ...this._mockData.currentUser.settings
    };
  },
  
  // Update user settings
  async updateUserSettings(settings) {
    console.log('Updating user settings:', settings);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update settings
    if (settings.default_post_privacy) {
      this._mockData.currentUser.settings.default_post_privacy = settings.default_post_privacy;
    }
    
    if (settings.profile_visibility) {
      this._mockData.currentUser.settings.profile_visibility = settings.profile_visibility;
    }
    
    // Update user profile
    if (settings.location) {
      this._mockData.currentUser.location = settings.location;
    }
    
    if (settings.bio !== undefined) {
      this._mockData.currentUser.bio = settings.bio;
    }
    
    if (settings.email !== undefined) {
      this._mockData.currentUser.email = settings.email;
    }
    
    if (settings.username !== undefined) {
      this._mockData.currentUser.username = settings.username;
    }
    
    // Return the updated user and settings
    return {
      ...this._mockData.currentUser,
      ...this._mockData.currentUser.settings
    };
  },
  
  // Get posts for feed
  async getPosts() {
    console.log('Getting posts for feed');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return all posts
    return {
      results: [...this._mockData.posts],
      count: this._mockData.posts.length
    };
  },
  
  // Get posts for a specific user
  async getUserPosts(userId) {
    console.log('Getting posts for user:', userId);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter posts by user ID
    const userPosts = this._mockData.posts.filter(post => post.user?.id.toString() === userId.toString());
    
    // If no posts found, create mock posts
    if (userPosts.length === 0) {
      // Get user info
      const user = userId === '1' || userId === 1 || userId === 'me'
        ? this._mockData.currentUser
        : this._mockData.users.find(u => u.id.toString() === userId.toString());
      
      if (user) {
        // Create mock posts
        const mockPosts = [
          {
            id: this._generateId(),
            content: `This is a post from ${user.username}`,
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            city: user.location?.city || '',
            region: user.location?.region || '',
            visibility: 'public',
            likes_count: Math.floor(Math.random() * 20),
            liked_by_current_user: false,
            user: {
              id: user.id,
              username: user.username
            },
            comments: []
          },
          {
            id: this._generateId() + 1,
            content: `Another post from ${user.username}`,
            created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            city: user.location?.city || '',
            region: user.location?.region || '',
            visibility: user.settings?.default_post_privacy || 'public',
            likes_count: Math.floor(Math.random() * 20),
            liked_by_current_user: false,
            user: {
              id: user.id,
              username: user.username
            },
            comments: []
          }
        ];
        
        // Add these mock posts to our data store
        this._mockData.posts = [...this._mockData.posts, ...mockPosts];
        
        return {
          results: mockPosts,
          count: mockPosts.length
        };
      }
    }
    
    return {
      results: userPosts,
      count: userPosts.length
    };
  },
  
  // Create a new post
  async createPost(postData) {
    console.log('Creating post:', postData);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // IMPORTANT FIX: Make sure we're using the current user for posts
    // If no user info is provided, use the current user
    const user = postData.user || {
      id: this._mockData.currentUser.id,
      username: this._mockData.currentUser.username
    };
    
    // Create the new post
    const newPost = {
      id: this._generateId(),
      content: postData.content || '',
      created_at: new Date().toISOString(),
      // IMPORTANT FIX: Use the provided location or current user's location
      city: postData.city || this._mockData.currentUser.location?.city || '',
      region: postData.region || this._mockData.currentUser.location?.region || '',
      // IMPORTANT FIX: Use the provided visibility or default
      visibility: postData.visibility || this._mockData.currentUser.settings?.default_post_privacy || 'public',
      likes_count: 0,
      liked_by_current_user: false,
      user: user,
      comments: []
    };
    
    // Add the new post to our data store
    this._mockData.posts.unshift(newPost);
    
    return newPost;
  },
  
  // Toggle like on a post
  async toggleLike(postId) {
    console.log('Toggling like for post:', postId);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the post
    const post = this._mockData.posts.find(p => p.id.toString() === postId.toString());
    
    if (post) {
      // Toggle like status
      post.liked_by_current_user = !post.liked_by_current_user;
      post.likes_count = post.liked_by_current_user
        ? post.likes_count + 1
        : Math.max(0, post.likes_count - 1);
      
      return {
        success: true,
        likes_count: post.likes_count,
        liked_by_current_user: post.liked_by_current_user
      };
    }
    
    return {
      success: false,
      error: 'Post not found'
    };
  },
  
  // Get comments for a post
  async getComments(postId) {
    console.log('Getting comments for post:', postId);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the post
    const post = this._mockData.posts.find(p => p.id.toString() === postId.toString());
    
    if (post) {
      return post.comments || [];
    }
    
    return [];
  },
  
  // Add a comment to a post
  async addComment(postId, content) {
    console.log('Adding comment to post:', postId, 'Content:', content);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the post
    const post = this._mockData.posts.find(p => p.id.toString() === postId.toString());
    
    if (post) {
      // Create new comment
      const newComment = {
        id: this._generateId(),
        content: content,
        created_at: new Date().toISOString(),
        user: {
          id: this._mockData.currentUser.id,
          username: this._mockData.currentUser.username
        }
      };
      
      // Add the comment to the post
      if (!post.comments) {
        post.comments = [];
      }
      
      post.comments.push(newComment);
      
      return newComment;
    }
    
    return {
      success: false,
      error: 'Post not found'
    };
  },
  
  // Search for users
  async searchUsers(query) {
    console.log('Searching users for:', query);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!query) {
      return {
        results: [...this._mockData.users],
        count: this._mockData.users.length
      };
    }
    
    // Filter users by query
    const lowercaseQuery = query.toLowerCase();
    const results = [
      this._mockData.currentUser,
      ...this._mockData.users
    ].filter(user => 
      user.username.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    );
    
    return {
      results,
      count: results.length
    };
  }
};