"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Clock, 
  DollarSign,
  Star,
  Users,
  Briefcase,
  Utensils,
  ShoppingBag,
  Truck,
  GraduationCap,
  HardHat,
  Calendar,
  Home,
  Filter,
  ChevronDown
} from "lucide-react";

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const jobCategories = [
    {
      id: "food-hospitality",
      title: "🍴 Food & Hospitality",
      icon: Utensils,
      color: "bg-orange-100 text-orange-600",
      jobs: [
        "Catering boy / Catering staff",
        "Waiter / Server",
        "Barista (coffee shop staff)",
        "Fast food crew (KFC, McDonald's, Domino's, etc.)",
        "Delivery boy (food delivery like Zomato/Swiggy)",
        "Dishwasher / Kitchen helper",
        "Event staff (serving, cleaning, organizing)",
        "Bartender assistant"
      ]
    },
    {
      id: "retail-sales",
      title: "🛍️ Retail & Sales",
      icon: ShoppingBag,
      color: "bg-blue-100 text-blue-600",
      jobs: [
        "Sales associate (mall, clothing store, electronics shop)",
        "Cashier",
        "Customer service helper",
        "Store stocker / Shelf organizer",
        "Promotional staff (handing flyers, samples, etc.)",
        "Mall kiosk helper"
      ]
    },
    {
      id: "logistics-delivery",
      title: "🚚 Logistics & Delivery",
      icon: Truck,
      color: "bg-green-100 text-green-600",
      jobs: [
        "Courier delivery (Amazon, Flipkart, DTDC, etc.)",
        "Warehouse helper",
        "Loading/unloading staff",
        "Bike/Car driver (with license)",
        "Office boy / Peon"
      ]
    },
    {
      id: "education-tutoring",
      title: "🏫 Education & Tutoring",
      icon: GraduationCap,
      color: "bg-purple-100 text-purple-600",
      jobs: [
        "Part-time tutor (school/college subjects)",
        "Home tuition teacher",
        "Library assistant",
        "Teaching assistant (for coaching institutes)"
      ]
    },
    {
      id: "labor-ground-work",
      title: "👷‍♂️ Labor & On-Ground Work",
      icon: HardHat,
      color: "bg-yellow-100 text-yellow-600",
      jobs: [
        "Construction helper",
        "Painter's helper",
        "Security guard",
        "Housekeeping staff (hotels, offices, apartments)",
        "Cleaning boy / Janitor",
        "Gardener"
      ]
    },
    {
      id: "event-promotion",
      title: "🎉 Event & Promotion Jobs",
      icon: Calendar,
      color: "bg-pink-100 text-pink-600",
      jobs: [
        "Event coordinator assistant",
        "Wedding helper (decoration, serving, setup)",
        "Ticket checker (cinema, events, exhibitions)",
        "Stage setup crew"
      ]
    },
    {
      id: "miscellaneous",
      title: "🏠 Miscellaneous",
      icon: Home,
      color: "bg-gray-100 text-gray-600",
      jobs: [
        "Data entry (basic, offline)",
        "Call center (voice/non-voice, non-tech support)",
        "Babysitting / Caretaker",
        "Pet walking / Pet care",
        "Delivery of newspapers/milk",
        "Packing staff (factories, small industries)"
      ]
    }
  ];

  const filteredCategories = jobCategories.filter(category => {
    if (selectedCategory && category.id !== selectedCategory) return false;
    if (searchQuery) {
      return category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             category.jobs.some(job => job.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MeWork</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Find Your Perfect <span className="text-green-600">Job</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Discover thousands of opportunities across various industries. 
                From hospitality to tech, find work that fits your schedule and skills.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search jobs, skills, or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">10,000+</div>
              <div className="text-gray-600">Active Jobs</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">500+</div>
              <div className="text-gray-600">Companies</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">4.8/5</div>
              <div className="text-gray-600">Rating</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {jobCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                id={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
              >
                {/* Category Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center`}>
                      <category.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                      <p className="text-gray-600">{category.jobs.length} job types available</p>
                    </div>
                  </div>
                </div>

                {/* Jobs Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.jobs.map((job, jobIndex) => (
                      <motion.div
                        key={jobIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: (index * 0.1) + (jobIndex * 0.05) }}
                        className="group"
                      >
                        <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-md">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                                {job}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>Remote/On-site</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Flexible</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-1 text-green-600">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-semibold">$15-25/hr</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">4.5+</span>
                            </div>
                            <button className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors">
                              Apply Now →
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already earning while studying. 
              Find flexible work that fits your schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/student-signup"
                className="bg-white text-green-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Find Jobs
              </Link>
              <Link
                href="/employer-signup"
                className="bg-green-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-800 transition-colors border border-green-500"
              >
                Post Jobs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold">MeWork</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting students with flexible work opportunities worldwide.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">For Students</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Find Jobs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Student Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">For Employers</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Post Jobs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Find Talent</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Employer Resources</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 MeWork. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}