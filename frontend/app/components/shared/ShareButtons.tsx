// components/shared/ShareButtons.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Facebook,
  MessageCircle,
  CheckCircle,
  Twitter,
  Linkedin,
  Mail,
  ExternalLink
} from 'lucide-react';
import type { Product } from '../../../types/product';

interface ShareButtonsProps {
  product: Product;
}

export default function ShareButtons({ product }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const [productUrl, setProductUrl] = useState('');

  // Build URL and detect native share API on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = `${window.location.origin}/products/${product.slug}`;
    setProductUrl(url);

    // runtime check: ensure share exists and is a function
    if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
      setHasNativeShare(true);
    }
  }, [product.slug]);

  // Hydration guard
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Copy utilities
  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard && window.isSecureContext) {
      (navigator as any).clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    if (typeof document === 'undefined') return;

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback copy failed:', err);
      // prompt as last resort
      // eslint-disable-next-line no-alert
      window.prompt('Copy to clipboard: Ctrl+C, Enter', text);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleCopyLink = () => {
    if (!productUrl) return;
    copyToClipboard(productUrl);
  };

  // Share actions
  const shareOnWhatsApp = () => {
    if (!productUrl) return;
    const text = `Check out "${product.name}" on Art Plazaa! ${product.shortDescription || ''} ${productUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;

    if (typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareOnFacebook = () => {
    if (!productUrl) return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    if (!productUrl) return;
    const text = `Check out "${product.name}" on Art Plazaa!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    if (!productUrl) return;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    if (!productUrl) return;
    const subject = `Check out "${product.name}" on Art Plazaa`;
    const body = `I thought you might like this product from Art Plazaa:\n\n${product.name}\n\n${product.shortDescription || ''}\n\nView it here: ${productUrl}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
  };

  const nativeShare = async () => {
    if (!productUrl || !hasNativeShare) return;

    try {
      await (navigator as any).share({
        title: product.name,
        text: product.shortDescription || 'Check out this amazing product!',
        url: productUrl,
      });
    } catch (error) {
      // share cancelled or errored
      // console.log('Share cancelled:', error);
    }
  };

  const openInNewTab = () => {
    if (!productUrl) return;
    window.open(productUrl, '_blank');
  };

  // Loading skeleton for SSR/hydration
  if (!isClient) {
    return (
      <div className="pt-6 md:pt-8 border-t border-gray-200">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-1 flex items-center">
            <Share2 className="w-5 h-5 mr-3 text-purple-600" />
            Share this product
          </h4>
          <p className="text-sm text-gray-500">Help others discover this amazing product!</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  // Actual UI
  return (
    <div className="pt-6 md:pt-8 border-t border-gray-200">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-1 flex items-center">
          <Share2 className="w-5 h-5 mr-3 text-purple-600" />
          Share this product
        </h4>
        <p className="text-sm text-gray-500">Help others discover this amazing product!</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={shareOnWhatsApp}
          className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium shadow hover:shadow-md active:scale-95 cursor-pointer"
          title="Share on WhatsApp"
          type="button"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="text-sm sm:text-base">WhatsApp</span>
        </button>

        <button
          onClick={shareOnFacebook}
          className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow hover:shadow-md active:scale-95 cursor-pointer"
          title="Share on Facebook"
          type="button"
        >
          <Facebook className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="text-sm sm:text-base">Facebook</span>
        </button>

        <button
          onClick={shareOnTwitter}
          className="flex items-center px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors font-medium shadow hover:shadow-md active:scale-95 cursor-pointer"
          title="Share on Twitter"
          type="button"
        >
          <Twitter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="text-sm sm:text-base">Twitter</span>
        </button>

        <button
          onClick={shareOnLinkedIn}
          className="flex items-center px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors font-medium shadow hover:shadow-md active:scale-95 cursor-pointer"
          title="Share on LinkedIn"
          type="button"
        >
          <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="text-sm sm:text-base">LinkedIn</span>
        </button>

        <button
          onClick={shareViaEmail}
          className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium shadow hover:shadow-md active:scale-95 cursor-pointer"
          title="Share via Email"
          type="button"
        >
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="text-sm sm:text-base">Email</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow hover:shadow-md active:scale-95 cursor-pointer"
          title="Copy product link"
          type="button"
        >
          {copied ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
          <span className="text-sm sm:text-base">{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>

        {hasNativeShare && (
          <button
            onClick={nativeShare}
            className="flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow hover:shadow-md active:scale-95 cursor-pointer"
            title="Share using device share dialog"
            type="button"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-sm sm:text-base">Share</span>
          </button>
        )}
      </div>

      {/* URL Preview */}
      {productUrl && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Product URL:</p>
          <div className="flex items-center">
            <div className="flex-1 bg-white border border-gray-300 rounded-l-lg px-3 py-2 overflow-hidden">
              <code className="text-sm text-gray-700 truncate block font-mono">{productUrl}</code>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-r-lg transition-colors font-medium border border-purple-600 cursor-pointer"
              type="button"
            >
              Copy
            </button>
            <button
              onClick={openInNewTab}
              className="ml-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium border border-gray-300 cursor-pointer flex items-center"
              title="Open in new tab"
              type="button"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {copied && (
        <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-3" />
            <div>
              <p className="font-semibold">Link Copied!</p>
              <p className="text-xs opacity-90">Paste it anywhere to share</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
