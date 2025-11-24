import { useState } from 'react';
import { Search } from 'lucide-react';
import { searchRemoteUser, getRemoteActor, followRemoteUser } from '../services/federationService';

export default function WebFingerSearch() {
  const [handle, setHandle] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [followSuccess, setFollowSuccess] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUser(null);

    try {
      const webfingerData = await searchRemoteUser(handle);
      console.log('WebFinger data:', webfingerData);
      
      const actorUrl = webfingerData.links?.find(l => l.type === 'application/activity+json')?.href;
      console.log('Actor URL:', actorUrl);
      
      if (actorUrl) {
        const actorData = await getRemoteActor(actorUrl);
        console.log('Actor data:', actorData);
        setUser(actorData);
      } else {
        setError('User not found - no actor URL in webfinger response');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(`Failed to find user: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowing(true);
    setError('');
    
    try {
      // Pass the full actor ID (URI) for remote users
      await followRemoteUser(user.id);
      setFollowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setFollowSuccess(false), 3000);
    } catch (err) {
      console.error('Follow error:', err);
      setError(`Failed to send follow request: ${err.response?.data?.error || err.message}`);
    } finally {
      setFollowing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4" style={{ color: '#7A3644' }}>
        Search Remote Users
      </h2>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@user@instance.social"
              className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-[#85993D]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#85993D' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#BBCC42'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#85993D'}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-white" style={{ backgroundColor: '#FF9886' }}>
          {error}
        </div>
      )}

      {user && (
        <div className="border-2 rounded-lg p-6" style={{ borderColor: '#FFE3AB' }}>
          <div className="flex items-start gap-4">
            <img
              src={user.icon?.url || '/default-avatar.png'}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4"
              style={{ borderColor: '#BBCC42' }}
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold" style={{ color: '#7A3644' }}>
                {user.name}
              </h3>
              <p className="text-gray-600 mb-2">@{user.preferredUsername}</p>
              {user.summary && (
                <div 
                  className="mt-2 text-sm text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: user.summary }} 
                />
              )}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleFollow}
                  disabled={following || followSuccess}
                  className="px-6 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: followSuccess ? '#BBCC42' : '#85993D' }}
                  onMouseOver={(e) => !following && !followSuccess && (e.target.style.backgroundColor = '#BBCC42')}
                  onMouseOut={(e) => !followSuccess && (e.target.style.backgroundColor = '#85993D')}
                >
                  {following ? 'Sending...' : followSuccess ? '✓ Followed!' : 'Follow'}
                </button>
                
                {followSuccess && (
                  <span className="text-sm font-medium" style={{ color: '#85993D' }}>
                    Follow request sent successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
