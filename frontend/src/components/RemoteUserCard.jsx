import { useState } from 'react';
import { Globe, UserPlus, UserMinus } from 'lucide-react';
import { followRemoteUser, unfollowRemoteUser } from '../services/federationService';

export default function RemoteUserCard({ user, isFollowing: initialFollowing = false }) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollowToggle = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowRemoteUser(user.username || user.preferredUsername);
        setIsFollowing(false);
      } else {
        await followRemoteUser(user.username || user.preferredUsername);
        setIsFollowing(true);
      }
    } catch (err) {
      alert('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  const displayName = user.display_name || user.name || user.username;
  const username = user.username || user.preferredUsername;
  const avatarUrl = user.avatar_url || user.icon?.url || '/default-avatar.png';
  const bio = user.bio || user.summary;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-2" style={{ borderColor: '#FFE3AB' }}>
      <div className="flex items-start gap-3">
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-16 h-16 rounded-full border-2"
          style={{ borderColor: '#BBCC42' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg truncate" style={{ color: '#7A3644' }}>
              {displayName}
            </h3>
            <Globe size={16} className="text-gray-500 flex-shrink-0" />
          </div>
          <p className="text-gray-600 text-sm mb-2">@{username}</p>
          {bio && (
            <div 
              className="text-sm text-gray-700 line-clamp-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: bio }} 
            />
          )}
        </div>
        <button
          onClick={handleFollowToggle}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 flex-shrink-0"
          style={{ 
            backgroundColor: isFollowing ? '#FF9886' : '#85993D'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = isFollowing ? '#7A3644' : '#BBCC42';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = isFollowing ? '#FF9886' : '#85993D';
            }
          }}
        >
          {loading ? (
            '...'
          ) : isFollowing ? (
            <>
              <UserMinus size={16} />
              Unfollow
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Follow
            </>
          )}
        </button>
      </div>
    </div>
  );
}
