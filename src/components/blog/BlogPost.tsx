import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { BlogPost as BlogPostType } from '../../types/blog';
import { getBlogPostBySlug } from '../../services/blogService';
import MarkdownRenderer from './MarkdownRenderer';
import { Helmet } from 'react-helmet-async';
import TopNavigation from '../pages/TopNavigation';
import BetaRegistrationModal from '../BetaRegistrationModal';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setError('No slug provided');
        setLoading(false);
        return;
      }

      try {
        const data = await getBlogPostBySlug(slug);
        if (!data || !data.is_published) {
          setError('Blog post not found');
        } else {
          setPost(data);
        }
      } catch (err) {
        setError('Failed to load blog post');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 animate-spin" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="spinnerGradientBlogPost" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b35" />
                <stop offset="100%" stopColor="#ffa07a" />
              </linearGradient>
            </defs>
            <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientBlogPost)" strokeWidth="4" strokeLinecap="round" strokeDasharray="90, 150" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">{error || 'Blog post not found'}</p>
          <Link
            to="/blog"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = `https://copyzap.app/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    image: post.featured_image_url ? [post.featured_image_url] : undefined,
    author: {
      '@type': 'Organization',
      name: 'CopyZap',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CopyZap',
      logo: {
        '@type': 'ImageObject',
        url: 'https://copyzap.app/logo_copyzap_1.png',
      },
    },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | CopyZap Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt || post.title} />
        {post.featured_image_url && <meta name="twitter:image" content={post.featured_image_url} />}

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <TopNavigation onOpenBetaModal={() => setIsBetaModalOpen(true)} />
      <BetaRegistrationModal
        isOpen={isBetaModalOpen}
        onClose={() => setIsBetaModalOpen(false)}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <article className="max-w-4xl mx-auto px-6 py-12">
          <Link
            to="/blog"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium mb-8"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Blog
          </Link>

          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <Calendar size={18} className="mr-2" />
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'No date'}
            </div>
          </header>

          {post.featured_image_url && (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-auto rounded-lg shadow-lg mb-8"
            />
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <MarkdownRenderer content={post.content} contentType={post.content_type} />
          </div>
        </article>
      </div>
    </>
  );
};

export default BlogPost;
