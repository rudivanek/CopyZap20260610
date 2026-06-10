import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Upload, Eye, EyeOff, Code, FileText } from 'lucide-react';
import { BlogPostFormData } from '../../types/blog';
import {
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  uploadBlogImage,
} from '../../services/blogService';
import { slugify, generateExcerpt } from '../../lib/blog';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import toast from 'react-hot-toast';

const AdminBlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isAdmin } = useIsAdmin(currentUser);
  const isEditMode = id !== 'new';

  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    content_type: 'markdown',
    featured_image_url: '',
    is_published: false,
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<'markdown' | 'html'>('markdown');

  // Sync content_type with editor mode
  useEffect(() => {
    setFormData((prev) => ({ ...prev, content_type: editorMode }));
  }, [editorMode]);

  useEffect(() => {
    // Wait for auth to initialize
    if (currentUser === undefined) {
      return;
    }

    // Check if user is admin - if not, show error instead of redirecting (prevents loop)
    if (!currentUser || !isAdmin) {
      setLoading(false);
      return;
    }

    if (isEditMode && id) {
      const fetchPost = async () => {
        try {
          const post = await getBlogPostById(id);
          if (post) {
            setFormData({
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt || '',
              content: post.content,
              content_type: post.content_type || 'markdown',
              featured_image_url: post.featured_image_url || '',
              is_published: post.is_published,
            });
            // Set editor mode based on loaded content type
            setEditorMode(post.content_type || 'markdown');
          } else {
            toast.error('Blog post not found');
            navigate('/admin/blog');
          }
        } catch (err) {
          toast.error('Failed to load blog post');
          console.error(err);
          navigate('/admin/blog');
        } finally {
          setLoading(false);
        }
      };

      fetchPost();
    } else {
      setLoading(false);
    }
  }, [id, isEditMode, currentUser]);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }));
  };

  const handleGenerateExcerpt = () => {
    const excerpt = generateExcerpt(formData.content);
    setFormData((prev) => ({ ...prev, excerpt }));
    toast.success('Excerpt generated');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadBlogImage(file);
      setFormData((prev) => ({ ...prev, featured_image_url: url }));
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        content_type: editorMode,
        is_published: publish,
      };

      if (isEditMode && id) {
        await updateBlogPost(id, dataToSave);
        toast.success(publish ? 'Post published successfully' : 'Post updated successfully');
      } else {
        await createBlogPost(dataToSave);
        toast.success(publish ? 'Post published successfully' : 'Post created successfully');
      }

      navigate('/admin/blog');
    } catch (err: any) {
      if (err.message?.includes('duplicate key value violates unique constraint')) {
        toast.error('A post with this slug already exists');
      } else {
        toast.error('Failed to save blog post');
      }
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-xl mb-4">Access Denied</p>
          <p className="text-gray-600 dark:text-gray-400">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 animate-spin" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="spinnerGradientBlogEditor" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b35" />
                <stop offset="100%" stopColor="#ffa07a" />
              </linearGradient>
            </defs>
            <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientBlogEditor)" strokeWidth="4" strokeLinecap="round" strokeDasharray="90, 150" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading blog post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fill in the details below to {isEditMode ? 'update' : 'create'} your blog post
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="post-url-slug"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              URL: /blog/{formData.slug || 'your-slug'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief description of the post"
            />
            <button
              type="button"
              onClick={handleGenerateExcerpt}
              className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Generate from content
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Featured Image
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.featured_image_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, featured_image_url: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <Upload size={16} className="mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              {formData.featured_image_url && (
                <img
                  src={formData.featured_image_url}
                  alt="Preview"
                  className="mt-2 max-w-md rounded-lg shadow-md"
                />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content *
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditorMode('markdown')}
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    editorMode === 'markdown'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <FileText size={16} className="mr-1.5" />
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('html')}
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    editorMode === 'html'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Code size={16} className="mr-1.5" />
                  HTML
                </button>
              </div>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              rows={20}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder={editorMode === 'markdown' ? 'Write your content in Markdown...' : 'Write your content in HTML...'}
            />
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
              {editorMode === 'markdown' ? (
                <>
                  <p>Supports Markdown syntax, images, and embeds</p>
                  <p className="text-xs">For videos: Use iframe embeds or HTML mode for advanced embedding</p>
                </>
              ) : (
                <>
                  <p>Write raw HTML for full control (sanitized on render)</p>
                  <p className="text-xs">Example: &lt;iframe src="..."&gt;&lt;/iframe&gt; for YouTube/Vimeo embeds</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              {formData.is_published ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Eye size={16} className="mr-1" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <EyeOff size={16} className="mr-1" />
                  Draft
                </span>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/admin/blog')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(false)}
                className="inline-flex items-center px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={saving}
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSave(true)}
                className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={saving}
              >
                <Eye size={18} className="mr-2" />
                {saving ? 'Publishing...' : formData.is_published ? 'Update & Publish' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogEditor;
