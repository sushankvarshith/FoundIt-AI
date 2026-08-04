import Modal from '../ui/Modal';
import { HiOutlineLink } from 'react-icons/hi';
import { FaWhatsapp, FaTelegram, FaFacebook, FaXTwitter } from 'react-icons/fa6';
import { itemService } from '../../services/services';
import toast from 'react-hot-toast';

export default function ShareModal({ isOpen, onClose, itemId, itemTitle }) {
  const url = `${window.location.origin}/items/${itemId}`;
  const text = `Check out this found item: "${itemTitle}" on FindIt AI`;

  const platforms = [
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp size={24} />,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    },
    {
      name: 'Telegram',
      icon: <FaTelegram size={24} />,
      color: 'bg-blue-500 hover:bg-blue-600',
      url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
      name: 'Facebook',
      icon: <FaFacebook size={24} />,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'X',
      icon: <FaXTwitter size={24} />,
      color: 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-700',
      url: `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
  ];

  const handleShare = async (platform) => {
    window.open(platform.url, '_blank', 'width=600,height=400');
    try {
      await itemService.trackShare(itemId, platform.name.toLowerCase());
    } catch {}
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
      try { await itemService.trackShare(itemId, 'copy'); } catch {}
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Item" size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.name}
              onClick={() => handleShare(platform)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white ${platform.color} transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              {platform.icon}
              <span className="font-medium text-sm">{platform.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none truncate"
          />
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
          >
            <HiOutlineLink size={16} />
            Copy
          </button>
        </div>
      </div>
    </Modal>
  );
}
