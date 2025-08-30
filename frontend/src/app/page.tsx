import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">StudentJobs</h1>
            </div>
            {/* Mobile menu button */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-4">
                <Link href="/student-home" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Student Home
                </Link>
                <Link href="/employer-home" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Employer Home
                </Link>
                <Link href="/admin-home" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Admin Home
                </Link>
                <Link href="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
              </div>
              {/* Mobile menu - simplified */}
              <div className="sm:hidden flex items-center space-x-2">
                <Link href="/student-home" className="text-indigo-600 hover:text-indigo-700 px-2 py-1 text-sm font-medium">
                  Student
                </Link>
                <Link href="/login" className="text-gray-700 hover:text-indigo-600 px-2 py-1 text-sm font-medium">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Mobile Responsive */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-6 sm:mt-10 mx-auto max-w-7xl px-4 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight font-extrabold text-gray-900 leading-tight">
                  <span className="block xl:inline">Find Your Perfect</span>{' '}
                  <span className="block text-indigo-600 xl:inline">Student Job</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 lg:max-w-none">
                  Connect with top employers and find part-time opportunities that fit your schedule. 
                  Build your career while studying with our student job platform.
                </p>
                <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/student-home"
                      className="w-full flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      Find Jobs
                    </Link>
                  </div>
                  <div className="sm:ml-3">
                    <Link
                      href="/employer-home"
                      className="w-full flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      Post Jobs
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        {/* Image Section - Mobile Responsive */}
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-48 sm:h-56 w-full bg-white lg:h-full flex items-center justify-center p-4">
            <img 
              src="/img/home.png" 
              alt="Student Jobs Platform" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Job Categories Section - Mobile Responsive */}
      <div className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Popular Part-Time Job Categories
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600">
              Find opportunities that match your skills and interests
            </p>
          </div>
          
          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: 'Food & Beverage',
                icon: '🍕',
                description: 'Restaurant staff, baristas, delivery drivers',
                jobCount: '150+ jobs',
                color: 'bg-red-50 border-red-200'
              },
              {
                title: 'Retail & Sales',
                icon: '🛍️',
                description: 'Store associates, cashiers, brand ambassadors',
                jobCount: '120+ jobs',
                color: 'bg-blue-50 border-blue-200'
              },
              {
                title: 'Tutoring & Education',
                icon: '📚',
                description: 'Subject tutors, language teachers, test prep',
                jobCount: '80+ jobs',
                color: 'bg-green-50 border-green-200'
              },
              {
                title: 'Technology & IT',
                icon: '💻',
                description: 'Web development, data entry, tech support',
                jobCount: '95+ jobs',
                color: 'bg-purple-50 border-purple-200'
              },
              {
                title: 'Marketing & Social Media',
                icon: '📱',
                description: 'Content creation, social media management',
                jobCount: '60+ jobs',
                color: 'bg-yellow-50 border-yellow-200'
              },
              {
                title: 'Customer Service',
                icon: '📞',
                description: 'Call center, online support, reception',
                jobCount: '75+ jobs',
                color: 'bg-indigo-50 border-indigo-200'
              }
            ].map((category) => (
              <div key={category.title} className={`p-4 sm:p-6 rounded-xl border-2 ${category.color} hover:shadow-lg transition-all duration-200`}>
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{category.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">{category.jobCount}</span>
                  <Link href="/student-home" className="text-indigo-600 hover:text-indigo-700 font-medium text-xs sm:text-sm">
                    Browse Jobs →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section - Mobile Responsive */}
      <div className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How StudentJobs Works
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600">
              Get started in just 3 simple steps
            </p>
          </div>
          
          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '1',
                title: 'Create Your Profile',
                description: 'Sign up and build your student profile with skills, experience, and availability',
                icon: '👤'
              },
              {
                step: '2',
                title: 'Browse & Apply',
                description: 'Search through hundreds of part-time jobs and apply with one click',
                icon: '🔍'
              },
              {
                step: '3',
                title: 'Get Hired & Work',
                description: 'Connect with employers, schedule interviews, and start earning',
                icon: '💼'
              }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-indigo-100 text-indigo-600 text-lg sm:text-2xl font-bold mb-3 sm:mb-4">
                  {item.step}
                </div>
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{item.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Stories Section - Mobile Responsive */}
      <div className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Student Success Stories
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600">
              See how other students are building their careers
            </p>
          </div>
          
          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: 'Priya Sharma',
                role: 'Computer Science Student',
                story: 'Found a part-time web development role that perfectly fits my class schedule. Now I\'m gaining real experience while studying!',
                company: 'TechStart Inc.',
                avatar: 'PS'
              },
              {
                name: 'Rahul Kumar',
                role: 'Business Student',
                story: 'Started as a marketing intern and now I\'m managing social media campaigns. Great way to build my portfolio!',
                company: 'Growth Marketing Co.',
                avatar: 'RK'
              },
              {
                name: 'Anjali Patel',
                role: 'Engineering Student',
                story: 'Working as a data analyst intern has given me practical skills that complement my coursework perfectly.',
                company: 'DataFlow Solutions',
                avatar: 'AP'
              }
            ].map((student) => (
              <div key={student.name} className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-base sm:text-lg">
                    {student.avatar}
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{student.role}</p>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 italic">"{student.story}"</p>
                <div className="text-xs sm:text-sm text-indigo-600 font-medium">
                  Working at {student.company}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section - Mobile Responsive */}
      <div className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-2xl sm:text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </p>
            <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-500 lg:mx-auto">
              Our platform provides students and employers with the tools they need to connect and grow together.
            </p>
          </div>

          <div className="mt-8 sm:mt-10">
            <div className="space-y-8 sm:space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="ml-12 sm:ml-16 text-base sm:text-lg leading-6 font-medium text-gray-900">Smart Job Matching</p>
                <p className="mt-2 ml-12 sm:ml-16 text-sm sm:text-base text-gray-500">
                  Our AI-powered system matches you with the perfect job opportunities based on your skills and preferences.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="ml-12 sm:ml-16 text-base sm:text-lg leading-6 font-medium text-gray-900">Flexible Scheduling</p>
                <p className="mt-2 ml-12 sm:ml-16 text-sm sm:text-base text-gray-500">
                  Find jobs that fit your academic schedule with flexible part-time and remote opportunities.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="ml-12 sm:ml-16 text-base sm:text-lg leading-6 font-medium text-gray-900">Verified Employers</p>
                <p className="mt-2 ml-12 sm:ml-16 text-sm sm:text-base text-gray-500">
                  All employers are verified and vetted to ensure safe and legitimate job opportunities.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="ml-12 sm:ml-16 text-base sm:text-lg leading-6 font-medium text-gray-900">Career Growth</p>
                <p className="mt-2 ml-12 sm:ml-16 text-sm sm:text-base text-gray-500">
                  Build your professional network and gain valuable experience for your future career.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section - Mobile Responsive */}
      <div className="bg-indigo-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="text-center lg:text-left lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <span className="block">Ready to start your career journey?</span>
                <span className="block text-indigo-200">Join thousands of students already working.</span>
              </h2>
            </div>
            <div className="mt-8 lg:mt-0 lg:flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-center lg:justify-start">
                <div className="inline-flex rounded-md shadow">
                  <Link
                    href="/student-home"
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
                <div className="sm:ml-3">
                  <Link
                    href="/employer-home"
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition-colors"
                  >
                    Hire Students
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Mobile Responsive */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white">StudentJobs</h3>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-300">
                Connecting students with part-time job opportunities. Find flexible work that fits your schedule 
                and build your career while studying.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">For Students</h4>
              <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-4">
                <li><Link href="/student-home" className="text-sm sm:text-base text-gray-300 hover:text-white">Student Home</Link></li>
                <li><Link href="/jobs" className="text-sm sm:text-base text-gray-300 hover:text-white">Browse Jobs</Link></li>
                <li><Link href="/student" className="text-sm sm:text-base text-gray-300 hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">For Employers</h4>
              <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-4">
                <li><Link href="/employer-home" className="text-sm sm:text-base text-gray-300 hover:text-white">Employer Home</Link></li>
                <li><Link href="/post-job" className="text-sm sm:text-base text-gray-300 hover:text-white">Post a Job</Link></li>
                <li><Link href="/employer" className="text-sm sm:text-base text-gray-300 hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8">
            <p className="text-sm sm:text-base text-gray-400 text-center">
              © 2024 StudentJobs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
