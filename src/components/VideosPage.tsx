import React, { useState, useEffect, useCallback } from 'react';
import { Play, X } from 'lucide-react';

interface VideoEntry {
  id: string;
  title: string;
  description?: string;
  youtubeId?: string;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const videos: VideoEntry[] = [
  {
    id: '1',
   title: 'Enhance Website Copy with AI in CopyZap',
    description: 'Generate Copy Variations from an Existing Website. Learn how to use Analyze Deep Crawl to scan a website and generate new copy variations based on the existing page content. Great for refreshing landing pages or repurposing competitor-inspired messaging.',
    youtubeId: extractYouTubeId('https://youtu.be/NFTiZxNOejk') ?? undefined,
  },
  {
    id: '2',
    title: 'Optimize and Apply Copy Variations in CopyZap',
    description: 'Learn how to compare content performance, apply AI-suggested improvements, customize copy with voice styles, and analyze multiple variations to optimize your writing in CopyZap.',
    youtubeId: extractYouTubeId('https://youtu.be/YVx81FpJ7Mg') ?? undefined,
  },
  {
    id: '3',
    title: 'Create AI-Powered Blog Posts Copy in CopyZap',
    description: 'Learn how to build targeted marketing copy using AI, select industries and audience segments, configure content structure, and generate multiple copy variations in CopyZap.',
    youtubeId: extractYouTubeId('https://youtu.be/4_tF_74rl6s') ?? undefined,
  },
];

// ── VideoCard ────────────────────────────────────────────────────────────────

const VideoCard: React.FC<{ video: VideoEntry; onOpen: (v: VideoEntry) => void }> = ({
  video,
  onOpen,
}) => {
  const hasVideo = !!video.youtubeId;

  return (
    <div id={`video-${video.id}`} className="flex flex-col sm:grid sm:grid-cols-2 gap-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 scroll-mt-6">
      {/* Title + description */}
      <div className="flex flex-col justify-center order-2 sm:order-1 gap-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {video.description}
          </p>
        )}
      </div>

      {/* Thumbnail / placeholder */}
      <div className="order-1 sm:order-2">
        <button
          onClick={() => hasVideo && onOpen(video)}
          disabled={!hasVideo}
          className={[
            'group relative w-full rounded-lg overflow-hidden aspect-video flex items-center justify-center border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            hasVideo
              ? 'border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer'
              : 'border-gray-200 dark:border-gray-700 cursor-default bg-gray-100 dark:bg-gray-800',
          ].join(' ')}
          aria-label={hasVideo ? `Watch: ${video.title}` : 'Coming soon'}
        >
          {hasVideo ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-orange-500 group-hover:bg-orange-600 transition-colors flex items-center justify-center shadow-xl">
                <Play size={24} className="text-white ml-1" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-orange-500 transition-colors">
                Watch video
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Play size={16} className="text-gray-400 dark:text-gray-500 ml-0.5" />
              </div>
              <span className="text-xs font-medium">Coming soon</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

// ── VideoModal ───────────────────────────────────────────────────────────────

const VideoModal: React.FC<{ video: VideoEntry; onClose: () => void }> = ({
  video,
  onClose,
}) => {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const embedSrc = video.youtubeId
    ? `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className="relative rounded-xl shadow-2xl overflow-hidden bg-black"
        style={{ width: 'min(90vw, calc(90vh * 16/9))', height: 'min(90vh, calc(90vw * 9/16))' }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-md text-white/70 hover:text-white hover:bg-black/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label="Close video"
        >
          <X size={18} />
        </button>

        {embedSrc && (
          <iframe
            src={embedSrc}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            width="100%"
            height="100%"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
};

// ── VideosPage ───────────────────────────────────────────────────────────────

const VideosPage: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<VideoEntry | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Videos
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed mb-6">
            Short practical tutorials showing how to use CopyZap features, from analyzing
            existing websites to generating stronger copy variations.
          </p>

          {/* In-page video nav */}
          {videos.length > 0 && (
            <nav aria-label="Jump to video" className="flex flex-wrap gap-2">
              {videos.map((v, i) => (
                <a
                  key={v.id}
                  href={`#video-${v.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  {v.title}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {videos.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-600">
            <Play size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-base font-medium">No videos yet — check back soon.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} onOpen={setActiveVideo} />
            ))}
          </div>
        )}
      </div>

      {activeVideo && (
        <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
};

export default VideosPage;
