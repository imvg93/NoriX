"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
            </div>
                <h1 className="text-xl sm:text-2xl font-bold text-green-600">MeWork</h1>
              </div>
            </div>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link href="/jobs" className="text-gray-700 hover:text-gray-900 font-medium">
                Jobs
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
                AboutUs
              </Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-gray-900 font-medium">
                How It Works
              </Link>
              <Link href="/signup" className="text-gray-700 hover:text-gray-900 font-medium">
                Sign up
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium">
                Log in
              </Link>
              <Link href="/admin-dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
                Admin Dashboard
              </Link>
              <Link href="/employer-home" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                Post Jobs
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                  <div className="w-full h-0.5 bg-gray-600"></div>
                  <div className="w-full h-0.5 bg-gray-600"></div>
                  <div className="w-full h-0.5 bg-gray-600"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-3">
            <Link href="/jobs" className="block text-gray-700 hover:text-gray-900 font-medium py-2">
              Jobs
            </Link>
            <Link href="/about" className="block text-gray-700 hover:text-gray-900 font-medium py-2">
              About
            </Link>
            <Link href="/how-it-works" className="block text-gray-700 hover:text-gray-900 font-medium py-2">
              How It Works
            </Link>
            <Link href="/signup" className="block text-gray-700 hover:text-gray-900 font-medium py-2">
              Sign up
            </Link>
            <Link href="/login" className="block text-gray-700 hover:text-gray-900 font-medium py-2">
              Log in
            </Link>
            <Link href="/admin-dashboard" className="block text-gray-700 hover:text-gray-900 font-medium py-2">
              Admin Dashboard
            </Link>
            <Link href="/employer-home" className="block bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-center">
              Post Jobs
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 bg-white overflow-hidden">
        {/* Abstract Shapes Background - Hidden on mobile for better performance */}
        <div className="absolute inset-0 hidden sm:block">
          {/* Left side dark green circle with blue lines */}
          <div className="absolute left-0 top-20 w-64 sm:w-80 lg:w-96 h-64 sm:h-80 lg:h-96 bg-green-800 rounded-full opacity-20"></div>
          <div className="absolute left-20 sm:left-32 top-32 sm:top-40 w-2 h-24 sm:h-32 bg-blue-500 transform rotate-45"></div>
          <div className="absolute left-28 sm:left-40 top-40 sm:top-48 w-2 h-16 sm:h-24 bg-blue-400 transform rotate-45"></div>
          
          {/* Right side flowing shapes */}
          <div className="absolute right-10 sm:right-20 top-8 sm:top-10 w-24 sm:w-32 h-24 sm:h-32 bg-green-300 rounded-full opacity-30"></div>
          <div className="absolute right-28 sm:right-40 top-24 sm:top-32 w-20 sm:w-24 h-20 sm:h-24 bg-yellow-300 rounded-full opacity-40"></div>
          <div className="absolute right-44 sm:right-60 top-16 sm:top-20 w-12 sm:w-16 h-12 sm:h-16 bg-green-400 rounded-full opacity-50"></div>
          
          {/* Yellow circular outline */}
          <div className="absolute right-24 sm:right-32 top-48 sm:top-60 w-16 sm:w-20 h-16 sm:h-20 border-4 border-yellow-400 rounded-full"></div>
          
          {/* 3x3 dots pattern */}
          <div className="absolute right-60 sm:right-80 top-32 sm:top-40 grid grid-cols-3 gap-1 sm:gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gray-600 rounded-full"></div>
            ))}
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-green-800 mb-6 sm:mb-8 leading-tight">
            Find trusted student works
          </h1>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="What kind of job are you looking for?"
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:border-green-500"
              />
              <button className="absolute right-1 sm:right-2 top-1 sm:top-2 bg-green-600 text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Service box - Responsive */}
          <div className="inline-block bg-white border-2 border-gray-300 rounded-lg px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
            <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Remote work service provided for</p>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded"></div>
              <span className="font-semibold text-gray-800 text-sm sm:text-base">Global Companies</span>
            </div>
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                title: 'Technology',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Marketing',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Education',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Business',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Creative',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Customer Service',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Remote Work',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Trending',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                highlighted: false
              }
            ].map((category) => (
              <div key={category.title} className={`flex flex-col items-center p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer ${category.highlighted ? 'bg-blue-50' : ''}`}>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${category.highlighted ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {category.title === 'Technology' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                    {category.title === 'Marketing' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2z" />}
                    {category.title === 'Education' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                    {category.title === 'Business' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
                    {category.title === 'Creative' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />}
                    {category.title === 'Customer Service' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
                    {category.title === 'Remote Work' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    {category.title === 'Trending' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">{category.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Sub-categories */}
      <section className="py-6 sm:py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {[
              'Web Development',
              'Mobile App Development',
              'Data Analysis',
              'UI/UX Design',
              'Software Testing',
              'DevOps'
            ].map((subcategory) => (
              <button key={subcategory} className="px-3 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm sm:text-base">
                {subcategory}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Everything you need to hire top talent */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to hire top talent
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 lg:gap-8">
            {/* Build your brand */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-full h-48 sm:h-56 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Professional workspace</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-3">Build your brand</h3>
              <p className="text-gray-600 leading-relaxed">
                Create a professional company profile that attracts the best student talent and showcases your culture.
              </p>
            </div>

            {/* Find the right candidates */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-full h-48 sm:h-56 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Smart filtering</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-3">Find the right candidates</h3>
              <p className="text-gray-600 leading-relaxed">
                Use advanced filters to find students with the exact skills, experience, and qualifications you need.
              </p>
            </div>

            {/* Connect with Gen Z */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-full h-48 sm:h-56 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Mobile-first platform</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-3">Connect with Gen Z</h3>
              <p className="text-gray-600 leading-relaxed">
                Reach students where they are with our mobile-optimized platform designed for the next generation.
              </p>
            </div>

            {/* Reduce time to hire */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-full h-48 sm:h-56 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Fast hiring process</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-3">Reduce time to hire</h3>
              <p className="text-gray-600 leading-relaxed">
                Streamline your hiring process with automated screening, instant messaging, and quick decision tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Projects */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Popular Projects
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Services provided by skilled students for your home and business needs
            </p>
          </div>
          
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0">
            <style jsx>{`
              .flex::-webkit-scrollbar {
                height: 4px;
              }
              .flex::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 2px;
              }
              .flex::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 2px;
              }
              .flex::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>
            {/* Furniture Assembly */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-72 sm:w-auto border border-gray-200">
              <div className="h-48 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Furniture Assembly</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Furniture Assembly</h3>
                <p className="text-sm text-gray-600">Projects starting at $49</p>
              </div>
            </div>

            {/* Mount Art or Shelves */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-72 sm:w-auto border border-gray-200">
              <div className="h-48 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Mount Art or Shelves</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Mount Art or Shelves</h3>
                <p className="text-sm text-gray-600">Projects starting at $65</p>
              </div>
            </div>

            {/* Mount a TV */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-72 sm:w-auto border border-gray-200">
              <div className="h-48 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Mount a TV</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Mount a TV</h3>
                <p className="text-sm text-gray-600">Projects starting at $69</p>
              </div>
            </div>

            {/* Help Moving */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-72 sm:w-auto border border-gray-200">
              <div className="h-48 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Help Moving</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Help Moving</h3>
                <p className="text-sm text-gray-600">Projects starting at $67</p>
              </div>
            </div>

            {/* Home & Apartment Cleaning */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-72 sm:w-auto border border-gray-200">
              <div className="h-48 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Home & Apartment Cleaning</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Home & Apartment Cleaning</h3>
                <p className="text-sm text-gray-600">Projects starting at $49</p>
              </div>
            </div>

            {/* Minor Plumbing Repairs */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-72 sm:w-auto border border-gray-200">
              <div className="h-48 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Minor Plumbing Repairs</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Minor Plumbing Repairs</h3>
                <p className="text-sm text-gray-600">Projects starting at $74</p>
              </div>
            </div>

            {/* Electrical Help */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-72 sm:w-auto border border-gray-200">
              <div className="h-48 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Electrical Help</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Electrical Help</h3>
                <p className="text-sm text-gray-600">Projects starting at $69</p>
              </div>
            </div>

            {/* Heavy Lifting */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-72 sm:w-auto border border-gray-200">
              <div className="h-48 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Heavy Lifting</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Heavy Lifting</h3>
                <p className="text-sm text-gray-600">Projects starting at $61</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              How it works
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-700 font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose</h3>
              <p className="text-gray-600">Select a student by skills and reviews</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-700 font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule</h3>
              <p className="text-gray-600">Book as early as today</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-700 font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete</h3>
              <p className="text-gray-600">Chat, pay, and review in one place</p>
            </div>
          </div>
        </div>
      </section>

      {/* Get help Today */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 opacity-30 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-100 opacity-40 rounded-full translate-y-20 -translate-x-20"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-700 mb-6">
              Get help Today
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {/* General Mounting */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              General Mounting
            </button>

            {/* TV Mounting */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              TV Mounting
            </button>

            {/* Furniture Assembly */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Furniture Assembly
            </button>

            {/* IKEA Furniture Assembly */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              IKEA Furniture Assembly
            </button>

            {/* Help Moving */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Help Moving
            </button>

            {/* House Cleaning */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              House Cleaning
            </button>

            {/* Yardwork */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Yardwork
            </button>

            {/* Furniture Removal */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Furniture Removal
            </button>

            {/* Lawn Care */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Lawn Care
            </button>

            {/* Hang Pictures */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Hang Pictures
            </button>

            {/* In Home Furniture Movers */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              In Home Furniture Movers
            </button>

            {/* Shelf Mounting */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Shelf Mounting
            </button>

            {/* Light Installation */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Light Installation
            </button>

            {/* Plumbing */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Plumbing
            </button>
          </div>

          <div className="text-left">
            <a href="/jobs" className="inline-flex items-center text-green-700 font-medium hover:text-green-800 transition-colors">
              See All Services
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold">MeWork</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connecting skilled students with opportunities worldwide. Find trusted help for your projects.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/jobs#labor-ground-work" className="text-gray-400 hover:text-white transition-colors">Furniture Assembly</a></li>
                <li><a href="/jobs#labor-ground-work" className="text-gray-400 hover:text-white transition-colors">TV Mounting</a></li>
                <li><a href="/jobs#labor-ground-work" className="text-gray-400 hover:text-white transition-colors">House Cleaning</a></li>
                <li><a href="/jobs#logistics-delivery" className="text-gray-400 hover:text-white transition-colors">Help Moving</a></li>
                <li><a href="/jobs#labor-ground-work" className="text-gray-400 hover:text-white transition-colors">Plumbing</a></li>
                <li><a href="/jobs#labor-ground-work" className="text-gray-400 hover:text-white transition-colors">Electrical Help</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Safety</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 MeWork. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">English</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Español</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Français</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Deutsch</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Help Button - Fixed Position */}
      <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50">
        <button className="w-12 h-12 sm:w-14 sm:h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
