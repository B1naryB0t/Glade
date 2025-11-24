import { Globe } from 'lucide-react';

export default function FederatedPostIndicator({ post }) {
  if (post.local_only || !post.federated_id) {
    return null;
  }

  const isFromRemote = post.federated_id && !post.federated_id.includes(window.location.hostname);

  return (
    <div 
      className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full"
      style={{ 
        backgroundColor: '#FFE3AB',
        color: '#7A3644'
      }}
    >
      <Globe size={14} />
      <span>{isFromRemote ? 'Remote' : 'Federated'}</span>
    </div>
  );
}
