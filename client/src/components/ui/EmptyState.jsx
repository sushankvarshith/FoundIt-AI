import { HiOutlineSearchCircle, HiOutlinePhotograph, HiOutlineCollection } from 'react-icons/hi';
import { motion } from 'framer-motion';

const illustrations = {
  noResults: {
    icon: <HiOutlineSearchCircle size={80} />,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
  },
  noItems: {
    icon: <HiOutlineCollection size={80} />,
    title: 'No items yet',
    description: 'Be the first to upload a found item and help reunite it with its owner!',
  },
  noImages: {
    icon: <HiOutlinePhotograph size={80} />,
    title: 'No images uploaded',
    description: 'Upload an image to use AI-powered visual search.',
  },
  noNotifications: {
    icon: '🔔',
    title: 'All caught up!',
    description: 'You have no new notifications.',
  },
  noMessages: {
    icon: '💬',
    title: 'No messages yet',
    description: 'Start a conversation with a finder to connect.',
  },
  noClaims: {
    icon: '📋',
    title: 'No claim requests',
    description: 'Claim requests from owners will appear here.',
  },
  noBookmarks: {
    icon: '🔖',
    title: 'No bookmarks',
    description: 'Save items you\'re interested in to find them later.',
  },
  error: {
    icon: '⚠️',
    title: 'Something went wrong',
    description: 'Please try again later or contact support.',
  },
};

export default function EmptyState({ type = 'noResults', title, description, action, className = '' }) {
  const config = illustrations[type] || illustrations.noResults;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="text-primary-300 dark:text-primary-600 mb-6"
      >
        {typeof config.icon === 'string' ? (
          <span className="text-7xl">{config.icon}</span>
        ) : (
          config.icon
        )}
      </motion.div>
      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2 font-display">
        {title || config.title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
        {description || config.description}
      </p>
      {action && action}
    </motion.div>
  );
}
