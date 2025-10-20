"use client";

import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Clock, Users, Star } from 'lucide-react';
import RoleProtectedRoute from '../../../components/auth/RoleProtectedRoute';

export default function StudentCoursesPage() {
  const courses = [
    {
      id: 1,
      title: 'Digital Marketing Fundamentals',
      instructor: 'Sarah Johnson',
      duration: '4 weeks',
      students: 1250,
      rating: 4.8,
      price: 'Free',
      description: 'Learn the basics of digital marketing and social media strategies.',
      category: 'Marketing'
    },
    {
      id: 2,
      title: 'Basic Computer Skills',
      instructor: 'Mike Chen',
      duration: '6 weeks',
      students: 890,
      rating: 4.6,
      price: 'Free',
      description: 'Essential computer skills for beginners and job seekers.',
      category: 'Technology'
    },
    {
      id: 3,
      title: 'Customer Service Excellence',
      instructor: 'Lisa Rodriguez',
      duration: '3 weeks',
      students: 2100,
      rating: 4.9,
      price: 'Free',
      description: 'Master customer service skills for retail and hospitality jobs.',
      category: 'Soft Skills'
    }
  ];

  return (
    <RoleProtectedRoute allowedRoles={['student']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Available Courses</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enhance your skills with our free courses designed to help you succeed in your career
          </p>
        </motion.div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {course.category}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {course.title}
                </h3>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>Instructor: {course.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{course.rating} rating</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {course.price}
                  </span>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Enroll Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              More Courses Coming Soon!
            </h2>
            <p className="text-gray-600 mb-6">
              We're constantly adding new courses to help you develop in-demand skills.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Data Analysis', 'Graphic Design', 'Project Management', 'Communication Skills'].map((topic) => (
                <span
                  key={topic}
                  className="px-4 py-2 bg-white text-gray-700 rounded-full border border-gray-200 text-sm font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </RoleProtectedRoute>
  );
}
