import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, X, Loader } from 'lucide-react';
import { apiClient } from '../services/apiClient';

function FollowRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    loadFollowRequests();
  }, []);

  const loadFollowRequests = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/auth/follow-requests/');
      // Handle both array and paginated response formats
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || response.data.requests || []);
      setRequests(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load follow requests:', err);
      setError('Failed to load follow requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (followId) => {
    setProcessingIds(prev => new Set(prev).add(followId));
    try {
      await apiClient.post(`/auth/follow-requests/${followId}/accept/`);
      setRequests(prev => prev.filter(req => req.id !== followId));
    } catch (err) {
      console.error('Failed to accept follow request:', err);
      setError('Failed to accept request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(followId);
        return next;
      });
    }
  };

  const handleReject = async (followId) => {
    setProcessingIds(prev => new Set(prev).add(followId));
    try {
      await apiClient.post(`/auth/follow-requests/${followId}/reject/`);
      setRequests(prev => prev.filter(req => req.id !== followId));
    } catch (err) {
      console.error('Failed to reject follow request:', err);
      setError('Failed to reject request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(followId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white">
        <div className="max-w-2xl mx-auto pt-8 px-4 pb-8">
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-burgundy animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream-light to-white">
      <div className="max-w-2xl mx-auto pt-8 px-4 pb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-burgundy mb-2">Follow Requests</h1>
          <p className="text-olive text-lg">
            Manage who can follow you
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-cream-dark/20 p-12 text-center">
            <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No pending requests
            </h3>
            <p className="text-gray-500">
              You don't have any follow requests at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md border border-cream-dark/20 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <img
                      src={request.follower.avatar_url || '/default-avatar.png'}
                      alt={request.follower.display_name || request.follower.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-coral"
                    />
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => navigate(`/profile/${request.follower.username}`)}
                        className="text-lg font-semibold text-burgundy hover:text-coral transition-colors"
                      >
                        {request.follower.display_name || request.follower.username}
                      </button>
                      <p className="text-sm text-gray-500">
                        @{request.follower.username}
                      </p>
                      {request.follower.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {request.follower.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={processingIds.has(request.id)}
                      className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-coral to-coral-dark text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingIds.has(request.id) ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processingIds.has(request.id)}
                      className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingIds.has(request.id) ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>Decline</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FollowRequestsPage;
