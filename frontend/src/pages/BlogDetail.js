import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BlogDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch blog post by slug
        const response = await axios.get(`${API}/blog-posts/slug/${slug}`);
        setPost(response.data);
        
        // Fetch related posts (same category, excluding current post)
        const relatedResponse = await axios.get(`${API}/blog-posts?category=${response.data.category}&limit=3`);
        const filtered = relatedResponse.data.filter(p => p.id !== response.data.id).slice(0, 3);
        setRelatedPosts(filtered);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load the article. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-9v4a1 1 0 11-2 0v-4a1 1 0 112 0zm0-4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || 'Blog post not found'}</p>
              <div className="mt-4">
                <Link 
                  to="/blog" 
                  className="text-red-700 underline hover:text-red-900"
                >
                  Return to blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="text-gray-700 hover:text-blue-600 text-sm">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <Link to="/blog" className="text-gray-700 hover:text-blue-600 ml-1 text-sm md:ml-2">
                  Blog
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="text-gray-500 ml-1 text-sm md:ml-2 line-clamp-1">{post.title}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <article className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Featured Image */}
            {post.featured_image && (
              <div className="h-72 sm:h-96 overflow-hidden">
                <img 
                  src={post.featured_image} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Article Header */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {post.category}
                </span>
                <span className="ml-4 text-gray-500 text-sm">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
              
              <div className="flex items-center mb-6">
                <div className="mr-2 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {post.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">By {post.author}</p>
                  <p className="text-sm text-gray-500">{post.view_count} views</p>
                </div>
              </div>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag, index) => (
                    <Link 
                      key={index} 
                      to={`/blog?tag=${tag}`}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Content */}
              <div className="prose prose-blue max-w-none">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
              
              {/* Social Sharing */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Share this article</h3>
                <div className="flex space-x-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"></path>
                    </svg>
                  </button>
                  <button className="bg-blue-400 hover:bg-blue-500 text-white p-2 rounded-full">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"></path>
                    </svg>
                  </button>
                  <button className="bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-full">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
                    </svg>
                  </button>
                  <button className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 p-2 rounded-full">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-11a1 1 0 0 1-2 0V7a1 1 0 0 1 2 0zm0 8a1 1 0 0 1-2 0v-4a1 1 0 0 1 2 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Inline Ad */}
          <div className="mt-8 bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">ADVERTISEMENT</div>
            <div className="h-[280px] w-full max-w-[336px] mx-auto bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">336x280 Ad</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Sidebar Ad */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-8">
            <div className="text-xs text-gray-500 mb-2">ADVERTISEMENT</div>
            <div className="h-[600px] w-[300px] mx-auto bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">300x600 Ad</span>
            </div>
          </div>
          
          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="px-6 py-4 bg-blue-600 text-white">
                <h3 className="font-bold">Related Articles</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {relatedPosts.map(relatedPost => (
                    <div key={relatedPost.id} className="flex items-center">
                      {relatedPost.featured_image ? (
                        <img 
                          src={relatedPost.featured_image} 
                          alt={relatedPost.title} 
                          className="h-16 w-16 object-cover rounded mr-4"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-200 rounded mr-4 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <Link 
                          to={`/blog/${relatedPost.slug}`} 
                          className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                        >
                          {relatedPost.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(relatedPost.created_at).toLocaleDateString('en-US', {
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Tags Cloud */}
          {post.tags && post.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-800 text-white">
                <h3 className="font-bold">Popular Tags</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Link 
                      key={index} 
                      to={`/blog?tag=${tag}`}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Ad */}
      <div className="mt-12 bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="text-xs text-gray-500 mb-2">ADVERTISEMENT</div>
        <div className="h-[250px] w-full max-w-[970px] mx-auto bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">970x250 Ad</span>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
