import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VisitForm = () => {
  const { islandId } = useParams();
  const [island, setIsland] = useState(null);
  const [islands, setIslands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { currentUser, updateUserData } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm({
    defaultValues: {
      island_id: islandId || '',
      visit_date: new Date().toISOString().split('T')[0],
      notes: '',
      photo_urls: []
    }
  });
  
  // Track selected files for preview
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all islands
        const islandsResponse = await axios.get(`${API}/islands`);
        setIslands(islandsResponse.data);
        
        // If islandId is provided, fetch that specific island
        if (islandId) {
          const islandResponse = await axios.get(`${API}/islands/${islandId}`);
          setIsland(islandResponse.data);
          setValue('island_id', islandId);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [islandId, setValue]);

  const onSubmit = async (data) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // For demo purposes, convert the string date to ISO format
      data.visit_date = new Date(data.visit_date).toISOString();
      
      // In a real app, you'd handle photo uploads here
      // For now, use empty array for photo_urls
      data.photo_urls = [];
      
      await axios.post(`${API}/visits`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update user data to reflect new visit
      updateUserData();
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error logging visit:', err);
      setError('Failed to log your visit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {islandId ? `Log Your Visit to ${island?.name}` : 'Log Your Island Visit'}
        </h1>
        <p className="mt-2 text-gray-600">
          Record the islands you've visited to track your Maldives journey and earn badges
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-9v4a1 1 0 11-2 0v-4a1 1 0 112 0zm0-4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-green-500 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Visit Logged Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your visit has been recorded. You'll be redirected to your dashboard shortly.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-8">
          {/* Island Selection */}
          <div className="mb-6">
            <label htmlFor="island_id" className="block text-sm font-medium text-gray-700 mb-1">
              Island
            </label>
            {islandId ? (
              <div className="flex items-center">
                <div className="flex-grow">
                  <input
                    type="text"
                    value={island?.name}
                    disabled
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  />
                  <input type="hidden" {...register('island_id')} />
                </div>
                <Link
                  to="/log-visit"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  Change
                </Link>
              </div>
            ) : (
              <div>
                <select
                  id="island_id"
                  {...register("island_id", { required: "Please select an island" })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an island</option>
                  {islands.map((island) => (
                    <option key={island.id} value={island.id}>
                      {island.name} ({island.atoll} Atoll)
                    </option>
                  ))}
                </select>
                {errors.island_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.island_id.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Visit Date */}
          <div className="mb-6">
            <label htmlFor="visit_date" className="block text-sm font-medium text-gray-700 mb-1">
              Visit Date
            </label>
            <input
              type="date"
              id="visit_date"
              {...register("visit_date", { required: "Visit date is required" })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.visit_date && (
              <p className="mt-1 text-sm text-red-600">{errors.visit_date.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={4}
              {...register("notes")}
              placeholder="Share your experience, favorite spots, or memories from this island..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Photo Upload (Placeholder - not functional in the MVP) */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photos (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload photos</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" disabled />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
                <p className="text-xs text-gray-400 italic">
                  (Photo upload will be available in a future update)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging Visit...
                </>
              ) : (
                'Log Visit'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VisitForm;
