"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import React from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Users,
  CreditCard,
  GraduationCap,
  BookOpen,
  UserCheck,
  Truck,
  Package,
  ShoppingCart,
  Building,
  FileText,
  ClipboardList,
  Library,
  Headphones,
  Phone,
  Baby,
  Heart,
  Search,
  Filter,
  MapPin,
  Clock,
  ArrowLeft,
  DollarSign,
  Star,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const ServicesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Animation refs
  const heroRef = useRef(null);
  const categoriesRef = useRef(null);
  const servicesRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true });
  const categoriesInView = useInView(categoriesRef, { once: true });
  const servicesInView = useInView(servicesRef, { once: true });

  // Work process modal state
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [selectedServiceInfo, setSelectedServiceInfo] = useState<any>(null);

  // Work details map (defaults used if missing)
  const workDetails: Record<string, { tasks: string; hours: string; eligibility: 'Male' | 'Female' | 'Male & Female' }> = {
    'Sales Associate': { tasks: 'Assist customers, manage billing, stock shelves, maintain store displays.', hours: '6-8 hours/day', eligibility: 'Male & Female' },
    'Brand Ambassador or Promoter': { tasks: 'Promote products at events, interact with customers, collect leads.', hours: '4-6 hours/event', eligibility: 'Male & Female' },
    'Cashier': { tasks: 'Handle billing, process payments, balance cash drawer, assist with queries.', hours: '6-8 hours/day', eligibility: 'Male & Female' },

    'School Subject Tutor (Math, Science, English)': { tasks: 'Plan lessons, conduct sessions, assign practice, track student progress.', hours: '1-2 hours/session', eligibility: 'Male & Female' },
    'Language Teacher (English or other languages)': { tasks: 'Teach language fundamentals, speaking practice, corrections, assessments.', hours: '1-2 hours/session', eligibility: 'Male & Female' },
    'Freelance Tutor': { tasks: 'Customize study plans, multi-subject support, regular assessments.', hours: 'Flexible per booking', eligibility: 'Male & Female' },

    'Food Delivery Person (bike or scooter)': { tasks: 'Pick up orders, navigate routes, deliver on time, maintain app ratings.', hours: '4-8 hours/shift', eligibility: 'Male & Female' },
    'Warehouse Helper or Picker': { tasks: 'Pick/pack orders, load/unload, manage inventory, maintain aisles.', hours: '6-8 hours/day', eligibility: 'Male & Female' },
    'Delivery for online orders': { tasks: 'Deliver parcels, obtain confirmations, handle returns, route planning.', hours: '4-8 hours/shift', eligibility: 'Male & Female' },

    'Receptionist': { tasks: 'Greet visitors, manage calls, schedule meetings, handle front desk.', hours: '6-8 hours/day', eligibility: 'Male & Female' },
    'Data Entry Operator': { tasks: 'Enter and verify data, maintain sheets, ensure accuracy and timeliness.', hours: '4-6 hours/day', eligibility: 'Male & Female' },
    'Simple Administrative Assistant': { tasks: 'File documents, coordinate schedules, handle emails, prepare reports.', hours: '6-8 hours/day', eligibility: 'Male & Female' },
    'Library Assistant': { tasks: 'Organize books, assist patrons, manage check-ins/outs, maintain records.', hours: '4-6 hours/day', eligibility: 'Male & Female' },

    'Telecaller (outbound calling)': { tasks: 'Make outbound calls, follow scripts, log outcomes, schedule follow-ups.', hours: '4-6 hours/day', eligibility: 'Male & Female' },
    'Customer Support Representative (non-IT)': { tasks: 'Answer queries via phone/chat, resolve issues, document cases.', hours: '6-8 hours/day', eligibility: 'Male & Female' },

    'Babysitter or Nanny': { tasks: 'Supervise children, prepare meals, engage in activities, basic care.', hours: '4-8 hours/day', eligibility: 'Female' },
    'Dog Walker': { tasks: 'Walk/exercise dogs, ensure safety, update owners, basic pet handling.', hours: '30-60 mins/walk', eligibility: 'Male & Female' },

    'Assignment Helper': { tasks: 'Assist with homework, structure content, check plagiarism and quality.', hours: '1-3 hours/task', eligibility: 'Male & Female' },
    'Exam Preparation Tutor': { tasks: 'Plan exam strategy, mock tests, concept revision and doubt-clearing.', hours: '1-2 hours/session', eligibility: 'Male & Female' },
    'Study Group Leader': { tasks: 'Set agendas, coordinate peers, lead discussions, share resources.', hours: '1-2 hours/session', eligibility: 'Male & Female' },
    'Note-Taking Service': { tasks: 'Attend classes, capture key points, format and share notes.', hours: 'Per class duration', eligibility: 'Male & Female' },
    'Research Assistant': { tasks: 'Collect data, analyze, prepare findings, assist with documentation.', hours: '2-4 hours/day', eligibility: 'Male & Female' },
    'Presentation Designer': { tasks: 'Design slides, apply templates, add visuals, proof and deliver.', hours: '2-4 hours/project', eligibility: 'Male & Female' },

    // New: Creative & Design
    'Graphic Designer': { tasks: 'Create designs for posts, banners, and simple brand assets.', hours: '2-4 hours/project', eligibility: 'Male & Female' },
    'Video Editor': { tasks: 'Assemble clips, add music and captions, export to spec.', hours: '2-5 hours/project', eligibility: 'Male & Female' },
    'Social Media Content Creator': { tasks: 'Ideate, shoot content, write captions, publish drafts.', hours: '1-3 hours/post', eligibility: 'Male & Female' },

    // New: Home Maintenance
    'House Cleaning': { tasks: 'Dusting, mopping, surface cleaning, basic kitchen and bath.', hours: '3-5 hours/visit', eligibility: 'Male & Female' },
    'Minor Electrical Help': { tasks: 'Assist bulb changes, basic fixture checks, simple replacements.', hours: '1-2 hours/visit', eligibility: 'Male & Female' },
    'Furniture Assembly': { tasks: 'Assemble flat-pack furniture and ensure stability and finishing.', hours: '2-3 hours/project', eligibility: 'Male & Female' },

    // Additional Services
    'Event Helper': { tasks: 'Set up venues, coordinate activities, assist guests, cleanup after events.', hours: '4-8 hours/event', eligibility: 'Male & Female' },
    'Gardening Assistant': { tasks: 'Plant care, watering, pruning, basic landscaping, tool maintenance.', hours: '2-4 hours/session', eligibility: 'Male & Female' },
    'Pet Sitting': { tasks: 'Feed pets, provide exercise, basic grooming, monitor health, house sitting.', hours: '4-8 hours/day', eligibility: 'Male & Female' },
    'Car Washing': { tasks: 'Wash exterior, clean interior, wax application, tire cleaning.', hours: '1-2 hours/car', eligibility: 'Male & Female' },
    'Moving Helper': { tasks: 'Pack items, load/unload truck, transport belongings, unpack at destination.', hours: '6-8 hours/day', eligibility: 'Male & Female' },
    'Photography Assistant': { tasks: 'Set up equipment, assist photographer, manage props, handle lighting.', hours: '3-6 hours/session', eligibility: 'Male & Female' },
    'Social Media Manager': { tasks: 'Create posts, engage followers, schedule content, analyze metrics.', hours: '2-4 hours/day', eligibility: 'Male & Female' },
    'Virtual Assistant': { tasks: 'Schedule meetings, manage emails, data entry, research tasks.', hours: '4-6 hours/day', eligibility: 'Male & Female' },
    'Content Writer': { tasks: 'Research topics, write articles, edit content, optimize for SEO.', hours: '2-4 hours/article', eligibility: 'Male & Female' },
    'Translation Services': { tasks: 'Translate documents, interpret conversations, maintain accuracy.', hours: '1-3 hours/project', eligibility: 'Male & Female' },
    'Personal Shopper': { tasks: 'Research products, compare prices, make purchases, deliver items.', hours: '2-4 hours/trip', eligibility: 'Male & Female' },
    'Tech Support': { tasks: 'Troubleshoot devices, install software, provide guidance, remote assistance.', hours: '1-2 hours/session', eligibility: 'Male & Female' },
    'Fitness Trainer': { tasks: 'Design workouts, demonstrate exercises, monitor form, provide motivation.', hours: '1-2 hours/session', eligibility: 'Male & Female' }
  };

  const openWorkModal = (service: any) => {
    const details = workDetails[service.name] || { tasks: service.description, hours: service.availability || 'Flexible', eligibility: 'Male & Female' };
    setSelectedServiceInfo({
      name: service.name,
      category: service.category,
      description: service.description,
      averagePay: service.averagePay,
      hours: details.hours,
      tasks: details.tasks,
      eligibility: details.eligibility
    });
    setWorkModalOpen(true);
  };

  const closeWorkModal = () => {
    setWorkModalOpen(false);
    setSelectedServiceInfo(null);
  };

  const serviceCategories = [
    {
      id: "retail-sales",
      name: "Retail and Sales",
      icon: <ShoppingBag className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "Sales Associate",
          description: "Assist customers with product selection, handle transactions, and maintain store appearance",
          requirements: ["Customer service skills", "Basic math", "Communication skills"],
          averagePay: "₹200-300/hour",
          availability: "Part-time, Full-time"
        },
        {
          name: "Brand Ambassador or Promoter",
          description: "Represent brands at events, promote products, and engage with potential customers",
          requirements: ["Outgoing personality", "Marketing awareness", "Event experience preferred"],
          averagePay: "₹250-400/hour",
          availability: "Event-based, Part-time"
        },
        {
          name: "Cashier",
          description: "Process transactions, handle payments, and provide customer service at checkout",
          requirements: ["Cash handling experience", "Attention to detail", "Friendly demeanor"],
          averagePay: "₹180-260/hour",
          availability: "Part-time, Full-time"
        }
      ]
    },
    {
      id: "teaching-tutoring",
      name: "Teaching and Tutoring",
      icon: <GraduationCap className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "School Subject Tutor (Math, Science, English)",
          description: "Provide one-on-one or group tutoring for academic subjects",
          requirements: ["Subject expertise", "Teaching experience", "Patience with students"],
          averagePay: "₹350-650/hour",
          availability: "Flexible hours"
        },
        {
          name: "Language Teacher (English or other languages)",
          description: "Teach language skills to students of various proficiency levels",
          requirements: ["Native or fluent speaker", "Teaching certification preferred", "Cultural awareness"],
          averagePay: "₹300-580/hour",
          availability: "Online, In-person"
        },
        {
          name: "Freelance Tutor",
          description: "Independent tutoring services across multiple subjects",
          requirements: ["Multiple subject expertise", "Self-motivation", "Business skills"],
          averagePay: "₹400-800/hour",
          availability: "Flexible schedule"
        }
      ]
    },
    {
      id: "delivery-logistics",
      name: "Delivery and Logistics",
      icon: <Truck className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "Food Delivery Person (bike or scooter)",
          description: "Deliver food orders to customers using bike or scooter",
          requirements: ["Valid driver's license", "Reliable transportation", "GPS navigation skills"],
          averagePay: "₹250-400/hour + tips",
          availability: "Flexible hours"
        },
        {
          name: "Warehouse Helper or Picker",
          description: "Assist with inventory management, order picking, and warehouse operations",
          requirements: ["Physical stamina", "Attention to detail", "Teamwork skills"],
          averagePay: "₹220-330/hour",
          availability: "Part-time, Full-time"
        },
        {
          name: "Delivery for online orders",
          description: "Deliver packages and online orders to residential and commercial addresses",
          requirements: ["Valid driver's license", "Reliable vehicle", "Customer service skills"],
          averagePay: "₹230-360/hour",
          availability: "Part-time, Full-time"
        }
      ]
    },
    {
      id: "administrative-office",
      name: "Administrative and Office Support",
      icon: <Building className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "Receptionist",
          description: "Greet visitors, handle phone calls, and manage front desk operations",
          requirements: ["Professional appearance", "Communication skills", "Basic computer skills"],
          averagePay: "₹200-300/hour",
          availability: "Part-time, Full-time"
        },
        {
          name: "Data Entry Operator",
          description: "Input and manage data in computer systems and databases",
          requirements: ["Typing speed (40+ WPM)", "Attention to detail", "Basic Excel skills"],
          averagePay: "₹220-320/hour",
          availability: "Remote, On-site"
        },
        {
          name: "Simple Administrative Assistant",
          description: "Provide general administrative support including filing, scheduling, and correspondence",
          requirements: ["Organizational skills", "Microsoft Office proficiency", "Time management"],
          averagePay: "₹230-350/hour",
          availability: "Part-time, Full-time"
        },
        {
          name: "Library Assistant",
          description: "Help patrons, organize materials, and maintain library operations",
          requirements: ["Love of books", "Customer service skills", "Basic computer skills"],
          averagePay: "₹200-280/hour",
          availability: "Part-time, Full-time"
        }
      ]
    },
    {
      id: "customer-service",
      name: "Customer Service and Telecalling",
      icon: <Headphones className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "Telecaller (outbound calling)",
          description: "Make outbound calls for sales, surveys, or customer outreach",
          requirements: ["Clear communication", "Persistence", "Script following ability"],
          averagePay: "₹200-300/hour + commission",
          availability: "Part-time, Full-time"
        },
        {
          name: "Customer Support Representative (non-IT)",
          description: "Handle customer inquiries, complaints, and provide support via phone/chat",
          requirements: ["Problem-solving skills", "Patience", "Product knowledge"],
          averagePay: "₹220-330/hour",
          availability: "Remote, On-site"
        }
      ]
    },
    {
      id: "child-pet-care",
      name: "Child and Pet Care",
      icon: <Heart className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "Babysitter or Nanny",
          description: "Provide childcare services including supervision, meals, and activities",
          requirements: ["Childcare experience", "First aid certification", "References"],
          averagePay: "₹250-400/hour",
          availability: "Flexible hours"
        },
        {
          name: "Dog Walker",
          description: "Walk and exercise dogs for pet owners who need assistance",
          requirements: ["Love of animals", "Physical fitness", "Reliability"],
          averagePay: "₹250-500/walk",
          availability: "Flexible schedule"
        }
      ]
    },
    {
      id: "student-specific",
      name: "Student-Specific Services",
      icon: <GraduationCap className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "Assignment Helper",
          description: "Help students with homework, research, and academic assignments",
          requirements: ["Strong academic background", "Subject expertise", "Time management"],
          averagePay: "₹150-300/hour",
          availability: "Evening, Weekend"
        },
        {
          name: "Exam Preparation Tutor",
          description: "Provide focused tutoring for upcoming exams and tests",
          requirements: ["Excellent grades", "Teaching ability", "Exam strategies"],
          averagePay: "₹200-400/hour",
          availability: "Flexible hours"
        },
        {
          name: "Study Group Leader",
          description: "Organize and lead study groups for specific subjects",
          requirements: ["Leadership skills", "Subject knowledge", "Communication"],
          averagePay: "₹180-320/hour",
          availability: "Weekend, Evening"
        },
        {
          name: "Note-Taking Service",
          description: "Take detailed notes during classes or lectures for other students",
          requirements: ["Fast typing", "Attention to detail", "Good handwriting"],
          averagePay: "₹100-200/hour",
          availability: "Class hours"
        },
        {
          name: "Research Assistant",
          description: "Help with research projects, data collection, and analysis",
          requirements: ["Research skills", "Analytical thinking", "Software proficiency"],
          averagePay: "₹250-450/hour",
          availability: "Flexible schedule"
        },
        {
          name: "Presentation Designer",
          description: "Create and design presentations for academic projects",
          requirements: ["Design skills", "Software knowledge", "Creativity"],
          averagePay: "₹200-350/hour",
          availability: "Flexible hours"
        }
      ]
    },
    // New Category: Creative and Design
    {
      id: "creative-design",
      name: "Creative and Design",
      icon: <BookOpen className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "Graphic Designer",
          description: "Design social posts, flyers, banners, and basic brand visuals.",
          requirements: ["Canva/Adobe basics", "Creativity", "Attention to detail"],
          averagePay: "₹300-600/hour",
          availability: "Project-based, Part-time"
        },
        {
          name: "Video Editor",
          description: "Edit short-form videos, add captions, transitions, export formats",
          requirements: ["CapCut/Premiere", "Story sense", "Fast turnaround"],
          averagePay: "₹350-700/hour",
          availability: "Project-based"
        },
        {
          name: "Social Media Content Creator",
          description: "Create reels/posts, basic photography, and captions aligned to brand.",
          requirements: ["Content trends", "Basic copywriting", "Consistency"],
          averagePay: "₹300-500/hour",
          availability: "Flexible"
        }
      ]
    },
    // New Category: Home Maintenance
    {
      id: "home-maintenance",
      name: "Home Maintenance",
      icon: <ClipboardList className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "House Cleaning",
          description: "Basic cleaning, dusting, mopping, kitchen and bathroom tidying.",
          requirements: ["Punctuality", "Stamina", "Careful handling"],
          averagePay: "₹250-450/hour",
          availability: "Part-time"
        },
        {
          name: "Minor Electrical Help",
          description: "Assist bulb changes, basic fixture checks, simple replacements.",
          requirements: ["Basic tools", "Safety aware", "Follow instructions"],
          averagePay: "₹300-500/hour",
          availability: "On-demand"
        },
        {
          name: "Furniture Assembly",
          description: "Assemble flat-pack furniture and ensure stability and finishing.",
          requirements: ["Read manuals", "Tools handling", "Patience"],
          averagePay: "₹350-600/hour",
          availability: "On-demand"
        }
      ]
    },
    // Additional Services Category
    {
      id: "additional-services",
      name: "Additional Services",
      icon: <Package className="w-8 h-8" />,
      color: "from-[#32A4A6] to-[#2A8B8E]",
      services: [
        {
          name: "Event Helper",
          description: "Assist with event setup, coordination, and cleanup for parties and functions",
          requirements: ["Physical stamina", "Time management", "Communication skills"],
          averagePay: "₹300-500/hour",
          availability: "Event-based"
        },
        {
          name: "Gardening Assistant",
          description: "Help with basic gardening tasks, plant care, and outdoor maintenance",
          requirements: ["Basic gardening knowledge", "Physical fitness", "Love for plants"],
          averagePay: "₹250-400/hour",
          availability: "Part-time"
        },
        {
          name: "Pet Sitting",
          description: "Take care of pets while owners are away, including feeding and basic care",
          requirements: ["Love of animals", "Reliability", "Basic pet care knowledge"],
          averagePay: "₹300-600/day",
          availability: "Flexible schedule"
        },
        {
          name: "Car Washing",
          description: "Provide car cleaning and washing services for vehicles",
          requirements: ["Attention to detail", "Physical stamina", "Basic equipment"],
          averagePay: "₹200-400/car",
          availability: "Flexible hours"
        },
        {
          name: "Moving Helper",
          description: "Assist with packing, moving, and unpacking household items",
          requirements: ["Physical strength", "Careful handling", "Time management"],
          averagePay: "₹400-800/day",
          availability: "On-demand"
        },
        {
          name: "Photography Assistant",
          description: "Help with photo shoots, equipment setup, and basic photography tasks",
          requirements: ["Basic photography knowledge", "Equipment handling", "Creativity"],
          averagePay: "₹500-1000/session",
          availability: "Project-based"
        },
        {
          name: "Social Media Manager",
          description: "Manage social media accounts, create content, and engage with followers",
          requirements: ["Social media expertise", "Content creation", "Analytics knowledge"],
          averagePay: "₹400-800/hour",
          availability: "Remote, Part-time"
        },
        {
          name: "Virtual Assistant",
          description: "Provide remote administrative support including scheduling and data management",
          requirements: ["Computer skills", "Communication", "Time management"],
          averagePay: "₹300-600/hour",
          availability: "Remote"
        },
        {
          name: "Content Writer",
          description: "Write articles, blogs, and marketing content for various platforms",
          requirements: ["Writing skills", "Research ability", "SEO knowledge"],
          averagePay: "₹200-500/article",
          availability: "Remote, Flexible"
        },
        {
          name: "Translation Services",
          description: "Translate documents, text, or provide interpretation services",
          requirements: ["Fluency in multiple languages", "Cultural awareness", "Accuracy"],
          averagePay: "₹300-800/hour",
          availability: "Remote, On-site"
        },
        {
          name: "Personal Shopper",
          description: "Help customers shop for clothes, groceries, or other items",
          requirements: ["Shopping knowledge", "Communication skills", "Time management"],
          averagePay: "₹250-450/hour",
          availability: "Flexible schedule"
        },
        {
          name: "Tech Support",
          description: "Provide basic technical support for computers, phones, and devices",
          requirements: ["Technical knowledge", "Problem-solving", "Patience"],
          averagePay: "₹350-650/hour",
          availability: "Remote, On-site"
        },
        {
          name: "Fitness Trainer",
          description: "Provide personal training and fitness guidance",
          requirements: ["Fitness knowledge", "Certification preferred", "Motivation skills"],
          averagePay: "₹500-1000/session",
          availability: "Flexible hours"
        }
      ]
    }
  ];

  // Get all services for filtering
  const allServices = serviceCategories.flatMap(category => 
    category.services.map(service => ({
      ...service,
      category: category.name,
      categoryId: category.id
    }))
  );

  // Debug logging
  console.log('Total service categories:', serviceCategories.length);
  console.log('Total services:', allServices.length);
  console.log('Selected category:', selectedCategory);
  console.log('Search term:', searchTerm);

  // Filter services based on selected category and search term
  const filteredServices = allServices.filter(service => {
    const matchesCategory = selectedCategory === "all" || service.categoryId === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
                className="inline-flex items-center space-x-2 bg-[#32A4A6]/10 text-[#32A4A6] px-4 py-2 rounded-full text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                <span>Professional Services</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
              >
                Professional{" "}
                <span className="bg-gradient-to-r from-[#32A4A6] to-[#2A8B8E] bg-clip-text text-transparent">
                  Services
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              >
                Discover a wide range of professional services offered by verified students and professionals worldwide.
              </motion.p>
            </div>

           
          </motion.div>
        </div>
      </section>

      {/* Service Categories */}
      <section ref={categoriesRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={categoriesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-16"
          >
           

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {serviceCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={categoriesInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                  className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 cursor-pointer overflow-hidden relative group"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="relative z-10 space-y-6">
                    <div className={`w-16 h-16 bg-[#32A4A6]/10 rounded-2xl flex items-center justify-center text-[#32A4A6] group-hover:bg-[#32A4A6] group-hover:text-white transition-all duration-300`}>
                      {category.icon}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-gray-900">{category.name}</h3>
                      <p className="text-gray-600 text-sm">
                        {category.services.length} service{category.services.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => openWorkModal({
                          ...category.services[0],
                          category: category.name,
                          categoryId: category.id
                        })}
                        className="inline-flex items-center space-x-2 text-sm font-medium text-white bg-[#32A4A6] hover:bg-[#2A8B8E] px-4 py-2 rounded-lg transition-colors"
                      >
                        <span>View Work Process</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute -bottom-12 -right-12 text-[#32A4A6]/5 group-hover:text-[#32A4A6]/10 transition-all duration-300 group-hover:scale-125">
                    {category.icon && (
                      <div className="w-40 h-40">
                        {React.cloneElement(category.icon, { className: "w-full h-full" })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <section ref={servicesRef} className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Available Services
                </h2>
                <p className="text-gray-600 mt-2">
                  {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === "all"
                      ? "bg-[#32A4A6] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Services
                </button>
                {serviceCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? "bg-[#32A4A6] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#32A4A6] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {filteredServices.map((service, index) => (
                <motion.div
                  key={`${service.categoryId}-${service.name}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={servicesInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -8,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openWorkModal(service)}
                  className="group bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-2xl hover:border-[#32A4A6]/20 transition-all duration-300 cursor-pointer h-full flex flex-col"
                >
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-[#32A4A6]/10 text-[#32A4A6] px-2 py-1 rounded-lg text-xs font-medium">
                          {service.category}
                        </span>
                        
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#32A4A6] transition-colors line-clamp-2">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                        {service.description}
                      </p>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {service.requirements.slice(0, 2).map((req, reqIndex) => (
                          <span key={reqIndex} className="bg-gray-50 text-gray-600 px-2 py-1 rounded-md text-xs">
                            {req}
                          </span>
                        ))}
                        {service.requirements.length > 2 && (
                          <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-md text-xs">
                            +{service.requirements.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pay and Availability */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-3 h-3 text-[#32A4A6]" />
                          <span className="text-sm font-medium text-gray-900">{service.averagePay}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Flexible</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-gray-100 mt-auto">
                      <div className="flex gap-2">
                        <Link
                          href="/jobs"
                          className="flex-1  text-black py-2.5 px-4 rounded-lg font-medium  transition-all duration-200 flex items-center justify-center space-x-2 text-sm group/btn"
                        >
                          <span>Find Jobs</span>
                          <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                        <button
                          onClick={() => openWorkModal(service)}
                          className="flex-1 border  text-[#32A4A6] py-2.5 px-4 rounded-lg font-medium  hover:text-black transition-all duration-200 text-sm"
                        >
                          Process
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#32A4A6] to-[#2A8B8E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join thousands of students and professionals offering their services through NoriX
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-[#32A4A6] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Offer Services</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/jobs"
                className="bg-[#2A8B8E] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#32A4A6] transition-colors border border-[#32A4A6] flex items-center justify-center space-x-2"
              >
                <span>Find Services</span>
                <Search className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Work Process Modal */}
      {workModalOpen && selectedServiceInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeWorkModal}></div>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
          >
            <div className="absolute top-3 right-3">
              <button onClick={closeWorkModal} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">{selectedServiceInfo.category}</p>
                <h3 className="text-2xl font-bold text-gray-900">{selectedServiceInfo.name}</h3>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#32A4A6]/5 border border-[#32A4A6]/15">
                  <p className="text-sm text-gray-700"><span className="font-semibold text-gray-900">What to do:</span> {selectedServiceInfo.tasks}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-500">Estimated Hours</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedServiceInfo.hours}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-500">Eligibility</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedServiceInfo.eligibility}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-gray-100">
                  <p className="text-xs text-gray-500">Average Pay</p>
                  <p className="text-sm font-semibold text-[#32A4A6]">{selectedServiceInfo.averagePay}</p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button onClick={closeWorkModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Close</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ServicesPage;
