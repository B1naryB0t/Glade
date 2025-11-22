import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus, Bell, Loader, Check } from 'lucide-react';
import { apiClient } from '../services/apiClient';

const NOTIFICATION_ICONS = {
  like: Heart,
  reply: MessageCircle,
  follow: UserPlus,
  follow_request: UserPlus,
  mention: MessageCircle,
};

function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const endpoint = filter === 'unread' ? '/notifications/unread/' : '/notifications/';
      const response = await apiClient.get(endpoint);
      setNotifications(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/`, { read: true });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read/');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.notification_type === 'follow_request') {
      navigate('/follow-requests');
    } else if (notification.post) {
      // Navigate to post (you'd need a post detail page)
      navigate(`/`);
    } else if (notification.actor) {
      navigate(`/profile/${notification.actor.username}`);
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
          <h1 className="text-4xl font-bold text-burgundy mb-2">Notifications</h1>
          <p className="text-olive text-lg">
            Stay updated with your activity
          </p>
        </div>

        {/* Filter and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-burgundy text-white'
                  : 'bg-white text-burgundy border border-burgundy hover:bg-burgundy/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-burgundy text-white'
                  : 'bg-white text-burgundy border border-burgundy hover:bg-burgundy/10'
              }`}
            >
              Unread
            </button>
          </div>

          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-1 px-4 py-2 text-sm text-coral hover:text-coral-dark font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-cream-dark/20 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread'
                ? "You're all caught up!"
                : "When you get notifications, they'll show up here."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.notification_type] || Bell;
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white rounded-lg shadow-md border border-cream-dark/20 p-4 hover:shadow-lg transition-all cursor-pointer ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={notification.actor.avatar_url || '/default-avatar.png'}
                      alt={notification.actor.display_name || notification.actor.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-coral"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-2">
                        <Icon
                          className={`w-4 h-4 mt-1 flex-shrink-0 ${
                            notification.notification_type === 'like'
                              ? 'text-red-500'
                              : notification.notification_type === 'follow' ||
                                notification.notification_type === 'follow_request'
                              ? 'text-blue-500'
                              : 'text-gray-500'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
