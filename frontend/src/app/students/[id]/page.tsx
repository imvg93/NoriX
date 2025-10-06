"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiService } from '../../../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Briefcase, 
  Star, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';

interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  userType: string;
  college?: string;
  skills?: string[];
  availability?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isDeactivated?: boolean;
  accountStatus?: string;
  rating?: number;
  completedJobs?: number;
  totalEarnings?: number;
}

const StudentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching student details for ID:', id);
        const response = await apiService.getUser(id);
        console.log('Student details response:', response);
        
        // Handle the response properly - the API returns the user data directly
        if (response && (response as any).user) {
          // Successfully fetched student data
          setStudent((response as any).user);
          
          // Log if account is deactivated
          if ((response as any).user.isDeactivated) {
            console.log('Note: This student account is deactivated');
          }
        } else if (response && (response as any)._id) {
          // If the response is the user object directly
          setStudent(response as any);
          
          // Log if account is deactivated
          if ((response as any).isDeactivated) {
            console.log('Note: This student account is deactivated');
          }
        } else {
          setError('Student details not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch student details:', err);
        
        // Handle specific error cases
        if (err?.message?.includes('deactivated')) {
          setError('This student account is deactivated and cannot be viewed.');
        } else if (err?.message?.includes('not found')) {
          setError('Student not found. The student may not exist.');
        } else {
          setError(err?.message || 'Failed to load student details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStudentDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">Unable to load student profile</h2>
            <p>{error || 'Student not found. The student may not exist or you may not have permission to view this profile.'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </button>

        {/* Deactivated Account Warning */}
        {student.isDeactivated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-600 text-sm font-bold">⚠</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">This student account is deactivated</h3>
                <p className="text-sm text-yellow-800">
                  This student's account is currently deactivated. They may not be actively looking for jobs or responding to messages. You can still view their profile and contact information below.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-orange-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">{student.name}</h1>
                <div className="flex items-center gap-4 text-orange-100">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {student.email}
                  </span>
                  {student.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {student.phone}
                    </span>
                  )}
                </div>
              </div>
              {student.isVerified && (
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-xl font-bold text-gray-900">
                      {student.rating ? `${student.rating}/5` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed Jobs</p>
                    <p className="text-xl font-bold text-gray-900">
                      {student.completedJobs || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-xl font-bold text-gray-900">
                      {student.totalEarnings ? `₹${student.totalEarnings.toLocaleString()}` : '₹0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.college && (
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">College</p>
                      <p className="font-medium text-gray-900">{student.college}</p>
                    </div>
                  </div>
                )}

                {student.availability && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Availability</p>
                      <p className="font-medium text-gray-900 capitalize">{student.availability}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">User Type</p>
                    <p className="font-medium text-gray-900 capitalize">{student.userType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Verification Status</p>
                    <p className={`font-medium ${student.isVerified ? 'text-green-600' : 'text-gray-600'}`}>
                      {student.isVerified ? 'Verified' : 'Not Verified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            {student.skills && student.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {student.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Actions */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Student</h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${student.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </a>
                {student.phone && (
                  <a
                    href={`tel:${student.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call Student
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDetailsPage;
