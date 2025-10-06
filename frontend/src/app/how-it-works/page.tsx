"use client";

import { useState, useEffect } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Search, 
  Send, 
  MessageCircle, 
  DollarSign,
  Briefcase,
  Users,
  Star,
  Shield,
  Globe,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Play
} from "lucide-react";

export default function HowItWorksPage() {
  const [activeStudentStep, setActiveStudentStep] = useState(0);
  const [activeEmployerStep, setActiveEmployerStep] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const heroRef = useRef(null);
  const studentRef = useRef(null);
  const employerRef = useRef(null);
  const featuresRef = useRef(null);
  const faqRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true });
  const studentInView = useInView(studentRef, { once: true });
  const employerInView = useInView(employerRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true });
  const faqInView = useInView(faqRef, { once: true });

  const heroControls = useAnimation();
  const studentControls = useAnimation();
  const employerControls = useAnimation();
  const featuresControls = useAnimation();
  const faqControls = useAnimation();

  useEffect(() => {
    if (heroInView) heroControls.start("visible");
    if (studentInView) studentControls.start("visible");
    if (employerInView) employerControls.start("visible");
    if (featuresInView) featuresControls.start("visible");
    if (faqInView) faqControls.start("visible");
  }, [heroInView, studentInView, employerInView, featuresInView, faqInView]);

  const studentSteps = [
    {
      icon: User,
      title: "Sign Up & Create Profile",
      description: "Join NoriX in seconds with your student credentials. Build a compelling profile showcasing your skills, experience, and availability.",
      color: "bg-gray-50 border-gray-200"
    },
    {
      icon: Search,
      title: "Browse & Search Jobs",
      description: "Discover thousands of opportunities tailored to students. Filter by location, pay rate, schedule, and skill requirements.",
      color: "bg-gray-50 border-gray-200"
    },
    {
      icon: Send,
      title: "Apply Instantly",
      description: "One-click applications with your pre-filled profile. No lengthy forms - just quick, smart applications.",
      color: "bg-gray-50 border-gray-200"
    },
    {
      icon: MessageCircle,
      title: "Track & Chat",
      description: "Communicate directly with employers through our secure messaging system. Track application status in real-time.",
      color: "bg-gray-50 border-gray-200"
    },
    {
      icon: DollarSign,
      title: "Get Hired & Paid",
      description: "Secure payments processed automatically. Get paid on time, every time, with full transparency.",
      color: "bg-gray-50 border-gray-200"
    }
  ];

  const employerSteps = [
    {
      icon: Briefcase,
      title: "Register & Post Jobs",
      description: "Create your employer account and post job opportunities in minutes. Set your requirements and budget.",
      color: "bg-gray-50 border-gray-200"
    },
    {
      icon: Users,
      title: "Smart Talent Matching",
      description: "Our AI matches you with qualified students based on skills, availability, and location preferences.",
      color: "bg-gray-50 border-gray-200"
    },
    {
      icon: Star,
      title: "Review & Manage",
      description: "Review applications, check student profiles, and manage your hiring pipeline from one dashboard.",
      color: "bg-gray-50 border-gray-200"
    },
    {
      icon: CheckCircle,
      title: "Hire & Onboard",
      description: "Make hiring decisions and onboard students seamlessly with our integrated workflow tools.",
      color: "bg-gray-50 border-gray-200"
    },
    {
      icon: DollarSign,
      title: "Pay & Rate",
      description: "Process payments securely and rate student performance to help build the community.",
      color: "bg-gray-50 border-gray-200"
    }
  ];

  const keyFeatures = [
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Bank-level security with instant payments",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Users,
      title: "AI Matching",
      description: "Smart algorithms connect the right people",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: CheckCircle,
      title: "Verified Profiles",
      description: "All users verified for safety and trust",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Connect students and employers worldwide",
      color: "bg-orange-100 text-orange-600"
    }
  ];

  const faqData = [
    {
      question: "How do I get started as a student?",
      answer: "Simply sign up with your student email, create your profile, and start browsing jobs. It takes less than 5 minutes to get started."
    },
    {
      question: "Is NoriX safe and secure?",
      answer: "Yes! We use bank-level encryption, verify all users, and provide secure payment processing. Your safety is our priority."
    },
    {
      question: "How quickly can I get hired?",
      answer: "Many students get hired within 24-48 hours of applying. Our smart matching system connects you with relevant opportunities instantly."
    },
    {
      question: "What types of jobs are available?",
      answer: "We offer everything from remote work and tutoring to local gigs like pet sitting, delivery, and event assistance."
    },
    {
      question: "How do payments work?",
      answer: "Payments are processed automatically through our secure platform. Students receive payments weekly, and employers can pay instantly."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      location: "University of Toronto",
      content: "NoriX helped me find flexible tech internships that fit my class schedule. I've earned over ₹2,50,000 this semester!",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Marcus Johnson",
      role: "Business Owner",
      location: "New York",
      content: "The quality of students on NoriX is outstanding. We've hired 5 students who are now part of our core team.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Priya Patel",
      role: "Marketing Student",
      location: "London School of Economics",
      content: "I love the variety of projects available. From social media management to event planning, there's always something interesting.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Back to Home Button */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        initial="hidden"
        animate={heroControls}
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
        }}
        className="relative py-20 px-4"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={heroInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4 mr-2" />
              Empowering Students and Employers Worldwide
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={heroInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            How <span className="text-green-600">NoriX</span> Works
          </motion.h1>
          
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={heroInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto"
          >
            Connect talented students with meaningful opportunities. Our platform makes it simple for students to find work and employers to find talent.
          </motion.p>

          {/* Clean Illustration */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={heroInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="bg-gray-50 rounded-2xl p-12 border border-gray-200"
              >
                <Users className="w-20 h-20 text-gray-700 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Students</h3>
                <p className="text-gray-600 text-lg">Find flexible work opportunities</p>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                className="bg-gray-50 rounded-2xl p-12 border border-gray-200"
              >
                <Briefcase className="w-20 h-20 text-gray-700 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Employers</h3>
                <p className="text-gray-600 text-lg">Access talented student workforce</p>
              </motion.div>
            </div>
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="w-6 h-6 bg-green-600 rounded-full"></div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Student Journey */}
      <motion.section 
        ref={studentRef}
        initial="hidden"
        animate={studentControls}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
        }}
        className="py-20 px-4 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Student Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From signup to getting paid - here's how students succeed on NoriX
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
            {studentSteps.map((step, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="relative"
              >
                <div className={`${step.color} rounded-2xl p-6 lg:p-8 text-center relative border h-full flex flex-col justify-between`}>
                  <div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="mb-4 lg:mb-6"
                    >
                      <step.icon className="w-10 h-10 lg:w-12 lg:h-12 mx-auto text-gray-700" />
                    </motion.div>
                    <h3 className="text-base lg:text-lg font-semibold mb-2 lg:mb-3 text-gray-900">{step.title}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{step.description}</p>
                  </div>
                  
                  <div className="absolute top-3 right-3 lg:top-4 lg:right-4 w-6 h-6 lg:w-8 lg:h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold text-gray-700">
                    {index + 1}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Employer Journey */}
      <motion.section 
        ref={employerRef}
        initial="hidden"
        animate={employerControls}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
        }}
        className="py-20 px-4 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Employer Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From posting jobs to hiring talent - here's how employers succeed on NoriX
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
            {employerSteps.map((step, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="relative"
              >
                <div className={`${step.color} rounded-2xl p-6 lg:p-8 text-center relative border h-full flex flex-col justify-between`}>
                  <div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="mb-4 lg:mb-6"
                    >
                      <step.icon className="w-10 h-10 lg:w-12 lg:h-12 mx-auto text-gray-700" />
                    </motion.div>
                    <h3 className="text-base lg:text-lg font-semibold mb-2 lg:mb-3 text-gray-900">{step.title}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{step.description}</p>
                  </div>
                  
                  <div className="absolute top-3 right-3 lg:top-4 lg:right-4 w-6 h-6 lg:w-8 lg:h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold text-gray-700">
                    {index + 1}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Key Features */}
      <motion.section 
        ref={featuresRef}
        initial="hidden"
        animate={featuresControls}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        className="py-20 px-4 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose NoriX?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with students and employers in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        ref={faqRef}
        initial="hidden"
        animate={faqControls}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        className="py-20 px-4 bg-gray-50"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about NoriX
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFAQ === index ? "auto" : 0,
                    opacity: openFAQ === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-600">{faq.answer}</div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
        }}
        className="py-20 px-4 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from students and employers
            </p>
          </div>

          <div className="relative">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center"
            >
              <img
                src={testimonials[currentTestimonial].avatar}
                alt={testimonials[currentTestimonial].name}
                className="w-20 h-20 rounded-full mx-auto mb-6 object-cover"
              />
              <blockquote className="text-xl text-gray-700 mb-6 italic">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{testimonials[currentTestimonial].name}</h4>
                <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                <p className="text-sm text-gray-500">{testimonials[currentTestimonial].location}</p>
              </div>
            </motion.div>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}
