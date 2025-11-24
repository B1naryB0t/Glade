import { useEffect, useState } from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { getFederatedFeed } from '../services/federationService';
import PostCard from '../components/PostCard';

export default function FederatedFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const data = await getFederatedFeed();
      setPosts(data.results || data);
    } catch (err) {
      console.error('Failed to load federated feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4"
          style={{ 
            borderColor: '#FFE3AB',
            borderTopColor: '#85993D'
          }}
        />
        <p className="text-gray-600">Loading federated posts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe size={32} style={{ color: '#85993D' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#7A3644' }}>
            Federated Timeline
          </h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 rounded-full transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#FFE3AB' }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#BBCC42'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#FFE3AB'}
        >
          <RefreshCw 
            size={20} 
            className={refreshing ? 'animate-spin' : ''}
            style={{ color: '#7A3644' }}
          />
        </button>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <div className="text-center py-16 px-4">
            <Globe size={64} className="mx-auto mb-4" style={{ color: '#FFE3AB' }} />
            <p className="text-xl font-semibold mb-2" style={{ color: '#7A3644' }}>
              No federated posts yet
            </p>
            <p className="text-gray-600">
              Follow some remote users to see their posts here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
