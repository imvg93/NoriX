"use client";

import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import {
  Globe,
  Users,
  Shield,
  Star,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
  Building,
  Search,
  Filter,
  ChevronDown,
  Play,
  Download,
  Heart,
  Award,
  Target,
  Zap,
  BookOpen,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Quote,
  TrendingUp,
  UserCheck,
  FileText,
  Briefcase,
  GraduationCap,
  Handshake,
  Lightbulb,
  BarChart3,
  Globe2,
  MapPin as MapPinIcon
} from "lucide-react";

const CareersPage = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Animation refs
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const howItWorksRef = useRef(null);
  const opportunitiesRef = useRef(null);
  const successRef = useRef(null);
  const trustRef = useRef(null);
  const professionalRef = useRef(null);
  const ctaRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true });
  const aboutInView = useInView(aboutRef, { once: true });
  const howItWorksInView = useInView(howItWorksRef, { once: true });
  const opportunitiesInView = useInView(opportunitiesRef, { once: true });
  const successInView = useInView(successRef, { once: true });
  const trustInView = useInView(trustRef, { once: true });
  const professionalInView = useInView(professionalRef, { once: true });
  const ctaInView = useInView(ctaRef, { once: true });

  // Sample data
  const testimonials = [
    {
      name: "Sarah Chen",
      location: "Singapore",
      role: "Software Engineering Intern",
      company: "TechCorp Asia",
      quote: "NoriX connected me with amazing opportunities across Asia. The verification process gave me confidence in every application.",
      image: "/api/placeholder/80/80",
      rating: 5
    },
    {
      name: "Miguel Rodriguez",
      location: "Mexico City",
      role: "Marketing Assistant",
      company: "Global Marketing Solutions",
      quote: "As an employer, I found incredible talent through NoriX. The platform's safety measures are unmatched.",
      image: "/api/placeholder/80/80",
      rating: 5
    },
    {
      name: "Priya Sharma",
      location: "Mumbai",
      role: "Data Analyst",
      company: "FinTech Innovations",
      quote: "The global reach of NoriX opened doors I never knew existed. Now I work with teams across three continents.",
      image: "/api/placeholder/80/80",
      rating: 5
    }
  ];

  const stats = [
    { number: "50K+", label: "Students Connected" },
    { number: "15K+", label: "Employers Worldwide" },
    { number: "95%", label: "Success Rate" },
    { number: "180+", label: "Countries" }
  ];

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Verified Global Talent",
      description: "Every student is thoroughly verified with background checks and skill assessments"
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: "Vetted Companies",
      description: "All employers are pre-screened and continuously monitored for quality and safety"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Transparent Reviews",
      description: "Real feedback from both students and employers ensures trust and quality"
    },
    {
      icon: <Phone className="w-8 h-8" />,
      title: "24/7 Support",
      description: "Round-the-clock multilingual support for all users worldwide"
    }
  ];

  const faqs = [
    {
      question: "How does NoriX ensure safety and verification?",
      answer: "We implement a comprehensive verification system including identity verification, background checks, skill assessments, and continuous monitoring. All users must complete KYC (Know Your Customer) verification before accessing the platform."
    },
    {
      question: "What types of opportunities are available?",
      answer: "NoriX offers part-time jobs, internships, freelance projects, and seasonal work across various industries including technology, marketing, customer service, tutoring, and more. Opportunities range from remote work to on-site positions."
    },
    {
      question: "How do I get started as a student?",
      answer: "Simply sign up, complete your profile verification, upload your documents, and start browsing opportunities. Our matching algorithm will suggest relevant positions based on your skills and preferences."
    },
    {
      question: "What languages are supported?",
      answer: "NoriX supports over 50 languages with full platform translation and multilingual customer support. Our interface adapts to your preferred language automatically."
    },
    {
      question: "How does the payment system work?",
      answer: "We offer secure payment processing with multiple options including bank transfers, digital wallets, and cryptocurrency. All transactions are protected with end-to-end encryption and fraud detection."
    }
  ];

  const professionalResources = [
    {
      category: "Resume Writing",
      icon: <FileText className="w-6 h-6" />,
      items: [
        "International resume templates",
        "ATS optimization guide",
        "Skills highlighting techniques",
        "Cover letter best practices"
      ]
    },
    {
      category: "Interview Tips",
      icon: <MessageSquare className="w-6 h-6" />,
      items: [
        "Virtual interview preparation",
        "Cultural sensitivity training",
        "Technical interview guides",
        "Salary negotiation tips"
      ]
    },
    {
      category: "Hiring Best Practices",
      icon: <Briefcase className="w-6 h-6" />,
      items: [
        "Remote team management",
        "Global hiring compliance",
        "Performance evaluation systems",
        "Diversity and inclusion strategies"
      ]
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-8 pb-16 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={heroInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium"
              >
                <Globe className="w-4 h-4" />
                <span>Trusted in 180+ Countries</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
              >
                Your Global Trusted Bridge to{" "}
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Career Opportunities
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              >
                Connecting ambitious students with reliable employers worldwide through verified, 
                transparent, and secure career opportunities.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                href="/signup"
                className="group bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
              >
                <span>Explore Student Opportunities</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/employer/signup"
                className="group bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
              >
                <span>Hire Trusted Talent</span>
                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
            </motion.div>

            {/* Animated Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-12"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  className="text-center space-y-2"
                >
                  <div className="text-3xl lg:text-4xl font-bold text-gray-900">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Me Work Section */}
      <section ref={aboutRef} id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={aboutInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center space-y-16"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={aboutInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium"
              >
                <Heart className="w-4 h-4" />
                <span>Trusted by Millions</span>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={aboutInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900"
              >
                About NoriX Careers
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={aboutInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
              >
                We're building the world's most trusted platform for connecting students with career opportunities. 
                Our mission is to create a global ecosystem where talent meets opportunity, backed by rigorous 
                verification, transparent processes, and unwavering commitment to safety.
              </motion.p>
            </div>

            {/* Feature Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={aboutInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={aboutInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-16"
          >
            <div className="text-center space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900"
              >
                How It Works
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Simple, secure, and transparent process for both students and employers
              </motion.p>
            </div>

            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center"
            >
              <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
                <button
                  onClick={() => setActiveTab("students")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === "students"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <GraduationCap className="w-5 h-5 inline mr-2" />
                  For Students
                </button>
                <button
                  onClick={() => setActiveTab("employers")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === "employers"
                      ? "bg-green-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Building className="w-5 h-5 inline mr-2" />
                  For Employers
                </button>
              </div>
            </motion.div>

            {/* Student Process */}
            {activeTab === "students" && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-8"
              >
                {[
                  { step: 1, title: "Create Profile", desc: "Sign up and build your professional profile", icon: <UserCheck className="w-8 h-8" /> },
                  { step: 2, title: "Get Verified", desc: "Complete identity and skill verification", icon: <Shield className="w-8 h-8" /> },
                  { step: 3, title: "Discover Jobs", desc: "Browse opportunities matching your skills", icon: <Search className="w-8 h-8" /> },
                  { step: 4, title: "Apply & Connect", desc: "Submit applications and connect with employers", icon: <Handshake className="w-8 h-8" /> },
                  { step: 5, title: "Start Working", desc: "Begin your new role with full support", icon: <Target className="w-8 h-8" /> }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                      {item.icon}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-blue-600">Step {item.step}</div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Employer Process */}
            {activeTab === "employers" && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-8"
              >
                {[
                  { step: 1, title: "Post Jobs", desc: "Create detailed job postings with requirements", icon: <FileText className="w-8 h-8" /> },
                  { step: 2, title: "Review Candidates", desc: "Browse verified student profiles and applications", icon: <Users className="w-8 h-8" /> },
                  { step: 3, title: "Interview & Select", desc: "Conduct interviews and select the best fit", icon: <MessageSquare className="w-8 h-8" /> },
                  { step: 4, title: "Onboard Talent", desc: "Seamlessly onboard your new team member", icon: <BookOpen className="w-8 h-8" /> },
                  { step: 5, title: "Track Progress", desc: "Monitor performance and provide feedback", icon: <BarChart3 className="w-8 h-8" /> }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto text-green-600">
                      {item.icon}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-green-600">Step {item.step}</div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Current Opportunities Section */}
      <section ref={opportunitiesRef} id="opportunities" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={opportunitiesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-16"
          >
            <div className="text-center space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={opportunitiesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900"
              >
                Current Opportunities
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={opportunitiesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Discover amazing opportunities from verified employers worldwide
              </motion.p>
            </div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={opportunitiesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-gray-50 p-6 rounded-2xl border border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search opportunities..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">All Regions</option>
                  <option value="north-america">North America</option>
                  <option value="europe">Europe</option>
                  <option value="asia">Asia</option>
                  <option value="remote">Remote</option>
                </select>
                <select className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Job Type</option>
                  <option value="part-time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                  <option value="contract">Contract</option>
                </select>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </motion.div>

            {/* Job Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[
                {
                  title: "Software Engineering Intern",
                  company: "TechCorp Global",
                  location: "San Francisco, CA",
                  type: "Internship",
                  duration: "6 months",
                  salary: "$25-35/hour",
                  description: "Join our engineering team to work on cutting-edge products used by millions worldwide.",
                  skills: ["React", "Python", "AWS", "Git"],
                  posted: "2 days ago"
                },
                {
                  title: "Digital Marketing Assistant",
                  company: "Creative Agency Pro",
                  location: "London, UK",
                  type: "Part-time",
                  duration: "3 months",
                  salary: "£15-20/hour",
                  description: "Support our marketing campaigns across multiple channels and help grow our client base.",
                  skills: ["Social Media", "Analytics", "Content Creation", "SEO"],
                  posted: "1 week ago"
                },
                {
                  title: "Data Analysis Intern",
                  company: "Finance Solutions Inc",
                  location: "Remote",
                  type: "Internship",
                  duration: "4 months",
                  salary: "$20-30/hour",
                  description: "Analyze financial data and create insights for our investment team.",
                  skills: ["Python", "SQL", "Excel", "Statistics"],
                  posted: "3 days ago"
                },
                {
                  title: "Customer Success Coordinator",
                  company: "SaaS Startup",
                  location: "Berlin, Germany",
                  type: "Part-time",
                  duration: "Ongoing",
                  salary: "€18-25/hour",
                  description: "Help customers succeed with our platform and drive engagement.",
                  skills: ["Communication", "CRM", "Problem Solving", "Analytics"],
                  posted: "5 days ago"
                }
              ].map((job, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={opportunitiesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600 font-medium">{job.company}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{job.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {job.type}
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {job.duration}
                      </span>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        {job.salary}
                      </span>
                    </div>

                    <p className="text-gray-600 leading-relaxed">{job.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, skillIndex) => (
                        <span key={skillIndex} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500">Posted {job.posted}</span>
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium">
                        Apply Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section ref={successRef} id="success-stories" className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={successInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-16"
          >
            <div className="text-center space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={successInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900"
              >
                Success Stories
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={successInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Hear from our global community of students and employers
              </motion.p>
            </div>

            {/* Testimonial Slider */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={successInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-4xl mx-auto">
                <div className="text-center space-y-6">
                  <div className="flex justify-center space-x-1">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <Quote className="w-12 h-12 text-blue-600 mx-auto" />
                  
                  <p className="text-lg text-gray-700 leading-relaxed italic">
                    "{testimonials[activeTestimonial].quote}"
                  </p>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-700">
                        {testimonials[activeTestimonial].name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">{testimonials[activeTestimonial].name}</h4>
                      <p className="text-gray-600">{testimonials[activeTestimonial].role}</p>
                      <p className="text-sm text-gray-500">{testimonials[activeTestimonial].company}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{testimonials[activeTestimonial].location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={() => setActiveTestimonial((prev) => prev === 0 ? testimonials.length - 1 : prev - 1)}
                  className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === activeTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveTestimonial((prev) => prev === testimonials.length - 1 ? 0 : prev + 1)}
                  className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </motion.div>

            {/* Impact Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={successInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {[
                { number: "15,000+", label: "Successful Placements", icon: <TrendingUp className="w-8 h-8" /> },
                { number: "98%", label: "Satisfaction Rate", icon: <Star className="w-8 h-8" /> },
                { number: "45", label: "Countries Active", icon: <Globe2 className="w-8 h-8" /> },
                { number: "24/7", label: "Support Available", icon: <Phone className="w-8 h-8" /> }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={successInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  className="text-center space-y-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                    {stat.icon}
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gray-900">{stat.number}</div>
                    <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust and Safety Section */}
      <section ref={trustRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={trustInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-16"
          >
            <div className="text-center space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={trustInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900"
              >
                Trust and Safety
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={trustInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Your safety and security are our top priorities
              </motion.p>
            </div>

            {/* Safety Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={trustInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: <Shield className="w-12 h-12" />,
                  title: "Identity Verification",
                  description: "Comprehensive background checks and document verification for all users",
                  features: ["Government ID verification", "Address confirmation", "Phone number validation", "Social media screening"]
                },
                {
                  icon: <Star className="w-12 h-12" />,
                  title: "Review System",
                  description: "Transparent feedback system with verified reviews from real experiences",
                  features: ["Verified user reviews", "Detailed feedback forms", "Response guarantee", "Dispute resolution"]
                },
                {
                  icon: <Phone className="w-12 h-12" />,
                  title: "24/7 Support",
                  description: "Round-the-clock multilingual support for all safety concerns",
                  features: ["Instant chat support", "Emergency hotline", "Multilingual team", "Priority escalation"]
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={trustInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-gray-50 p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-green-100 rounded-2xl flex items-center justify-center text-blue-600">
                      {item.icon}
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                      <ul className="space-y-2">
                        {item.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Compliance Documents */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={trustInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-3xl border border-gray-200"
            >
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-semibold text-gray-900">Global Compliance & Safety</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Download our comprehensive safety and compliance documentation
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button className="bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 shadow-lg border border-gray-200">
                    <Download className="w-5 h-5" />
                    <span>Safety Policy</span>
                  </button>
                  <button className="bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 shadow-lg border border-gray-200">
                    <Download className="w-5 h-5" />
                    <span>Privacy Policy</span>
                  </button>
                  <button className="bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 shadow-lg border border-gray-200">
                    <Download className="w-5 h-5" />
                    <span>Terms of Service</span>
                  </button>
                  <button className="bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 shadow-lg border border-gray-200">
                    <Download className="w-5 h-5" />
                    <span>Compliance Guide</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Professional Development Section */}
      <section ref={professionalRef} className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={professionalInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-16"
          >
            <div className="text-center space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={professionalInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900"
              >
                Professional Development
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={professionalInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Comprehensive resources for career growth and success
              </motion.p>
            </div>

            {/* Resource Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={professionalInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-8"
            >
              <div className="flex justify-center">
                <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
                  {professionalResources.map((resource, index) => (
                    <button
                      key={resource.category}
                      onClick={() => setActiveTab(resource.category.toLowerCase().replace(' ', '-'))}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        activeTab === resource.category.toLowerCase().replace(' ', '-')
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {resource.icon}
                        <span>{resource.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Content */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                {professionalResources.map((resource, index) => (
                  <motion.div
                    key={resource.category}
                    initial={{ opacity: 0, x: 20 }}
                    animate={activeTab === resource.category.toLowerCase().replace(' ', '-') ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4 }}
                    className={`${activeTab === resource.category.toLowerCase().replace(' ', '-') ? 'block' : 'hidden'}`}
                  >
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                          {resource.icon}
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900">{resource.category}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {resource.items.map((item, itemIndex) => (
                          <motion.div
                            key={itemIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: itemIndex * 0.1 }}
                            className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{item}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={professionalInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div className="text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about NoriX
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                        openFAQ === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{
                      height: openFAQ === index ? 'auto' : 0,
                      opacity: openFAQ === index ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section ref={ctaRef} className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center space-y-12"
          >
            <div className="space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={ctaInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
              >
                Join Us Today
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={ctaInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-blue-100 max-w-3xl mx-auto"
              >
                Start your journey with the world's most trusted career platform
              </motion.p>
            </div>

            {/* Side-by-side Signup Forms */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={ctaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
            >
              {/* Student Signup */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={ctaInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white p-8 rounded-2xl shadow-xl"
              >
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Join as a Student</h3>
                  <p className="text-gray-600">Create Your Global Profile</p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Fast verification process</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Access to global opportunities</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Multilingual support</span>
                    </div>
                  </div>
                  <Link
                    href="/signup"
                    className="block w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Start as Student
                  </Link>
                </div>
              </motion.div>

              {/* Employer Signup */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={ctaInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white p-8 rounded-2xl shadow-xl"
              >
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto text-green-600">
                    <Building className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Join as an Employer</h3>
                  <p className="text-gray-600">Hire Reliable Talent Worldwide</p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Verified talent pool</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Global reach</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>24/7 support</span>
                    </div>
                  </div>
                  <Link
                    href="/employer/signup"
                    className="block w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                  >
                    Start Hiring
                  </Link>
                </div>
              </motion.div>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={ctaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-center space-y-4"
            >
              <p className="text-blue-100 text-lg">
                Already have an account? <Link href="/login" className="text-white font-semibold hover:underline">Sign in here</Link>
              </p>
              <div className="flex justify-center space-x-8 text-blue-100">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>50+ Languages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Bank-level Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>50K+ Active Users</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;
