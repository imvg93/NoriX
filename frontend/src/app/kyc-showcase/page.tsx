"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Smartphone, 
  Palette, 
  Shield, 
  Zap, 
  Users,
  ArrowRight,
  Star,
  Heart
} from 'lucide-react';

const KYCShowcase: React.FC = () => {
  const features = [
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Optimized for mobile devices with responsive tablet and desktop layouts'
    },
    {
      icon: Palette,
      title: 'Dual Theme System',
      description: 'Trust-Blue and Warm-Teal themes with smooth switching'
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Encrypted storage, consent-based data collection, and privacy controls'
    },
    {
      icon: Zap,
      title: 'Smooth Animations',
      description: 'Micro-animations, transitions, and success celebrations'
    },
    {
      icon: Users,
      title: 'Accessibility First',
      description: 'WCAG AA compliant with keyboard navigation and screen reader support'
    },
    {
      icon: CheckCircle,
      title: 'Real-time Validation',
      description: 'Instant feedback with friendly error messages and success states'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            KYC Profile Verification
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive, mobile-first KYC system designed for student part-time work platforms. 
            Built with modern React, TypeScript, and Framer Motion.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kyc-profile"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
            >
              <Star className="w-5 h-5" />
              Try Live Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium text-lg border-2 border-blue-600"
            >
              <Heart className="w-5 h-5" />
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          id="features"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Form Sections Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-8 shadow-lg mb-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Complete Form Sections
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Basic Info', icon: '👤', color: 'blue' },
              { title: 'Academic', icon: '🎓', color: 'green' },
              { title: 'Stay & Availability', icon: '🏠', color: 'purple' },
              { title: 'Identity Verification', icon: '📄', color: 'orange' },
              { title: 'Emergency Contact', icon: '❤️', color: 'red' },
              { title: 'Work Preferences', icon: '💼', color: 'indigo' },
              { title: 'Payroll Details', icon: '💳', color: 'teal' }
            ].map((section, index) => (
              <div
                key={section.title}
                className={`p-4 rounded-xl bg-${section.color}-50 border border-${section.color}-200 text-center`}
              >
                <div className="text-2xl mb-2">{section.icon}</div>
                <h3 className={`font-medium text-${section.color}-900`}>
                  {section.title}
                </h3>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Technical Specs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🛠️ Technical Stack
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>• React 18 with TypeScript</li>
              <li>• Framer Motion for animations</li>
              <li>• Tailwind CSS for styling</li>
              <li>• Lucide React for icons</li>
              <li>• Mobile-first responsive design</li>
              <li>• WCAG AA accessibility compliance</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ✨ Key Features
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Progressive disclosure with 7 sections</li>
              <li>• Real-time validation and error handling</li>
              <li>• Auto-save with visual indicators</li>
              <li>• File upload with drag-and-drop</li>
              <li>• Theme switching (Blue/Teal)</li>
              <li>• Success animations and confetti</li>
            </ul>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Experience the complete KYC verification flow
          </p>
          
          <Link
            href="/kyc-profile"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium text-lg shadow-lg"
          >
            <Star className="w-5 h-5" />
            Launch Demo
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default KYCShowcase;
