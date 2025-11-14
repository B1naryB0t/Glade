// TEMPORARY MOCK - Replace with apiClient.REAL_BACKUP.js when backend is ready
const mockApiClient = {
  defaults: { headers: { common: {} } },
  
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  },

  // Mock data store (to persist data between calls)
  _mockData: {
    currentUser: {
      id: 1,
      username: 'demo_user',
      email: 'demo@example.com',
      bio: 'This is a demo user profile for testing.',
      created_at: '2023-01-01T00:00:00Z',
      location: {
        city: 'Charlotte',
        region: 'North Carolina'
      },
      settings: {
        profile_visibility: 'public',
        default_post_privacy: 'public',
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
      },
      {
        id: 3,
        content: 'Just had an amazing coffee at a local cafe! ☕ The atmosphere here is perfect for getting some work done. Anyone know other great spots in the area?',
        created_at: '2023-09-23T14:45:00Z',
        city: 'Charlotte',
        region: 'North Carolina',
        visibility: 'public',
        likes_count: 5,
        liked_by_current_user: false,
        user: {
          id: 1,
          username: 'demo_user'
        },
        comments: []
      }
    ]
  },
  
  // Generate a new unique ID
  _generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  },
  
  // Find a post by ID
  _findPost(postId) {
    return this._mockData.posts.find(post => post.id.toString() === postId.toString());
  },
  
  // Find a user by ID
  _findUser(userId) {
    if (userId === 'me' || userId.toString() === "1") {
      return this._mockData.currentUser;
    }
    
    const foundUser = this._mockData.users.find(user => user.id.toString() === userId.toString());
    
    // If user doesn't exist in our mock data, create a mock user for this ID
    if (!foundUser) {
      const mockUser = {
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
        posts_count: 2, // We'll create 2 mock posts for this user
        is_followed: false
      };
      
      // Add this user to our mock data
      this._mockData.users.push(mockUser);
      
      // Create mock posts for this user
      this._createMockPostsForUser(mockUser);
      
      return mockUser;
    }
    
    return foundUser;
  },
  
  // Create mock posts for a user
  _createMockPostsForUser(user) {
    const mockPosts = [
      {
        id: this._generateId(),
        content: `This is a post from ${user.username}`,
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        city: user.location.city,
        region: user.location.region,
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
        city: 'Another City',
        region: 'Another Region',
        visibility: 'public',
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
  },
  
  async post(url, data) {
    console.log('Mock POST:', url, data);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (url.includes('/auth/login')) {
      const username = data.get ? data.get('username') : data.username;
      return {
        data: {
          access_token: 'mock_token_' + Date.now(),
          user: { 
            id: 1, 
            username: username || 'demo_user',
            email: (username || 'demo') + '@example.com'
          }
        }
      };
    }
    
    if (url.includes('/auth/register')) {
      return {
        data: {
          access_token: 'mock_token_' + Date.now(),
          user: {
            id: 1,
            username: data.username,
            email: data.email
          }
        }
      };
    }
    
    if (url.includes('/posts/')) {
      if (url.includes('/like/')) {
        const postId = url.split('/').slice(-2)[0];
        const post = this._findPost(postId);
        
        if (post) {
          post.liked_by_current_user = !post.liked_by_current_user;
          post.likes_count = post.liked_by_current_user ? post.likes_count + 1 : Math.max(0, post.likes_count - 1);
          
          return { 
            data: { 
              success: true,
              likes_count: post.likes_count,
              liked_by_current_user: post.liked_by_current_user
            } 
          };
        }
      }
      
      if (url.includes('/comments/')) {
        const postId = url.split('/').slice(-2)[0];
        const post = this._findPost(postId);
        
        if (post) {
          const newComment = {
            id: this._generateId(),
            content: data.content,
            created_at: new Date().toISOString(),
            user: {
              id: this._mockData.currentUser.id,
              username: this._mockData.currentUser.username
            }
          };
          
          if (!post.comments) {
            post.comments = [];
          }
          
          post.comments.push(newComment);
          
          return { data: newComment };
        }
      }
    }
    
    // Creating a new post
    if (url === '/api/v1/posts/') {
      // Extract content and other fields
      let content, city, region, visibility;
      
      if (data instanceof FormData) {
        content = data.get('content');
        city = data.get('city');
        region = data.get('region');
        visibility = data.get('visibility');
      } else {
        content = data.content;
        city = data.city;
        region = data.region;
        visibility = data.visibility;
      }
      
      console.log("Creating post with:", { content, city, region, visibility });
      
      const newPost = {
        id: this._generateId(),
        content: content || '',
        created_at: new Date().toISOString(),
        city: city || '',
        region: region || '',
        visibility: visibility || 'public', // Default to public
        user: {
          id: this._mockData.currentUser.id,
          username: this._mockData.currentUser.username
        },
        likes_count: 0,
        liked_by_current_user: false,
        comments: []
      };
      
      // Add to posts list
      this._mockData.posts.unshift(newPost);
      
      return { data: newPost };
    }
    
    if (url.includes('/auth/settings/')) {
      console.log("Updating user settings with:", data);
      
      // Update user settings
      if (data.default_post_privacy) {
        this._mockData.currentUser.settings.default_post_privacy = data.default_post_privacy;
      }
      
      if (data.profile_visibility) {
        this._mockData.currentUser.settings.profile_visibility = data.profile_visibility;
      }
      
      if (data.email_notifications !== undefined) {
        this._mockData.currentUser.settings.email_notifications = data.email_notifications;
      }
      
      if (data.browser_notifications !== undefined) {
        this._mockData.currentUser.settings.browser_notifications = data.browser_notifications;
      }
      
      // Update user profile
      if (data.location) {
        this._mockData.currentUser.location = data.location;
      }
      
      if (data.bio !== undefined) {
        this._mockData.currentUser.bio = data.bio;
      }
      
      if (data.username !== undefined) {
        this._mockData.currentUser.username = data.username;
      }
      
      if (data.email !== undefined) {
        this._mockData.currentUser.email = data.email;
      }
      
      return {
        data: {
          ...this._mockData.currentUser,
          ...this._mockData.currentUser.settings,
          success: true
        }
      };
    }
    
    return { data: { success: true } };
  },
  
  async get(url) {
    console.log('Mock GET:', url);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // User profile
    if (url.includes('/auth/profile/')) {
      let userId;
      
      // Handle various profile URL patterns
      if (url.includes('/auth/profile/me')) {
        userId = '1'; // Current user
      } else {
        // Extract the ID from URL
        userId = url.split('/').pop();
      }
      
      console.log("Loading profile for user ID:", userId);
      const user = this._findUser(userId);
      
      if (user) {
        // For consistency, ensure all profile data includes the same fields
        return {
          data: { 
            ...user,
            followers_count: user.followers_count || 0,
            following_count: user.following_count || 0,
            posts_count: user.posts_count || 0,
            location: user.location || { city: '', region: '' },
            bio: user.bio || '',
            is_followed: user.id !== 1 ? (user.is_followed || false) : false // Can't follow yourself
          }
        };
      }
      
      // If user not found, return 404
      return { status: 404, data: { error: "User not found" } };
    }
    
    // Posts - Comments
    if (url.includes('/posts/') && url.includes('/comments/')) {
      const postId = url.split('/').slice(-2)[0];
      const post = this._findPost(postId);
      
      if (post && post.comments) {
        return { data: post.comments };
      }
      
      return { data: [] };
    }
    
    // Posts by user
    if (url.includes('/posts/user/')) {
      const userId = url.split('/').pop();
      console.log("Finding posts for user ID:", userId);
      
      // Get all posts by this user
      const userPosts = this._mockData.posts.filter(
        post => post.user.id.toString() === userId.toString()
      );
      
      console.log(`Found ${userPosts.length} posts for user ${userId}`);
      
      return {
        data: {
          results: userPosts,
          next: null,
          previous: null,
          count: userPosts.length
        }
      };
    }
    
    // User settings
    if (url.includes('/auth/settings/')) {
      console.log("Returning user settings:", {
        ...this._mockData.currentUser,
        ...this._mockData.currentUser.settings
      });
      
      return {
        data: {
          ...this._mockData.currentUser,
          ...this._mockData.currentUser.settings
        }
      };
    }
    
    // User search
    if (url.includes('/auth/search/users/')) {
      const queryParam = url.split('?')[1];
      const query = queryParam ? queryParam.split('=')[1] : '';
      
      if (query) {
        const decodedQuery = decodeURIComponent(query).toLowerCase();
        const filteredUsers = [
          ...this._mockData.users,
          this._mockData.currentUser
        ].filter(user => 
          user.username.toLowerCase().includes(decodedQuery)
        );
        
        return {
          data: {
            results: filteredUsers,
            count: filteredUsers.length
          }
        };
      }
      
      return {
        data: {
          results: this._mockData.users,
          count: this._mockData.users.length
        }
      };
    }
    
    // Feed for homepage
    if (url === '/api/v1/posts/') {
      return {
        data: {
          results: this._mockData.posts,
          next: null,
          previous: null,
          count: this._mockData.posts.length
        }
      };
    }
    
    return { data: {} };
  },
  
  async patch(url, data) {
    console.log('Mock PATCH:', url, data);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (url.includes('/auth/settings/')) {
      console.log("Updating user settings with PATCH:", data);
      
      // Update user settings
      if (data.default_post_privacy) {
        this._mockData.currentUser.settings.default_post_privacy = data.default_post_privacy;
      }
      
      if (data.profile_visibility) {
        this._mockData.currentUser.settings.profile_visibility = data.profile_visibility;
      }
      
      if (data.email_notifications !== undefined) {
        this._mockData.currentUser.settings.email_notifications = data.email_notifications;
      }
      
      if (data.browser_notifications !== undefined) {
        this._mockData.currentUser.settings.browser_notifications = data.browser_notifications;
      }
      
      // Update user profile
      if (data.location) {
        this._mockData.currentUser.location = data.location;
      }
      
      if (data.bio !== undefined) {
        this._mockData.currentUser.bio = data.bio;
      }
      
      if (data.username !== undefined) {
        this._mockData.currentUser.username = data.username;
      }
      
      if (data.email !== undefined) {
        this._mockData.currentUser.email = data.email;
      }
      
      return {
        data: {
          ...this._mockData.currentUser,
          ...this._mockData.currentUser.settings,
          success: true
        }
      };
    }
    
    return { data: { success: true } };
  },
  
  async delete(url) {
    console.log('Mock DELETE:', url);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (url.includes('/posts/')) {
      const postId = url.split('/').slice(-2)[0];
      const postIndex = this._mockData.posts.findIndex(post => post.id.toString() === postId.toString());
      
      if (postIndex !== -1) {
        this._mockData.posts.splice(postIndex, 1);
        return { data: { success: true } };
      }
    }
    
    return { data: { success: true } };
  }
};

export const apiClient = mockApiClient;