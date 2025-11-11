"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Cpu,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Smartphone,
  Sparkles,
  UploadCloud,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type HelpCategory = {
  slug: string;
  title: string;
  description: string;
  highlights: string[];
  icon: LucideIcon;
};

type FAQ = {
  question: string;
  answer: string;
  category: HelpCategory["slug"];
};

type SupportChannel = {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
};

type FormState = "idle" | "submitting" | "success" | "error";

const helpCategories: HelpCategory[] = [
  {
    slug: "account",
    title: "Account & Security",
    description: "Manage passwords, privacy controls, verification, and sign-in alerts.",
    highlights: ["Password reset", "Profile verification", "Two-factor auth"],
    icon: UserCog,
  },
  {
    slug: "jobs",
    title: "Jobs & Applications",
    description: "Track applications, resolve posting issues, and optimize hiring visibility.",
    highlights: ["Application status", "Job publishing", "Smart matching"],
    icon: Briefcase,
  },
  {
    slug: "chat",
    title: "Chat & Messaging",
    description: "Fix chat notifications, manage conversation history, and enable alerts.",
    highlights: ["Message delivery", "Conversation export", "Notifications"],
    icon: MessageCircle,
  },
  {
    slug: "billing",
    title: "Billing & Invoices",
    description: "Access invoices, update payment methods, and manage subscriptions.",
    highlights: ["Invoice history", "Refund status", "Payment methods"],
    icon: CreditCard,
  },
  {
    slug: "technical",
    title: "Technical Support",
    description: "Troubleshoot performance, integrations, and platform reliability.",
    highlights: ["API access", "Downtime reports", "Browser support"],
    icon: Cpu,
  },
  {
    slug: "mobile",
    title: "Mobile Experience",
    description: "Optimize the Norix mobile app, notifications, and offline support.",
    highlights: ["Push alerts", "App performance", "Offline mode"],
    icon: Smartphone,
  },
];

const faqs: FAQ[] = [
  {
    category: "account",
    question: "How do I reset my password?",
    answer:
      "Head to Account Settings → Security → Reset Password. Enter your registered email and follow the secure reset link we send via Resend. You can also enable two-factor authentication in the same section for additional protection.",
  },
  {
    category: "jobs",
    question: "Why isn’t my job posting visible?",
    answer:
      "New job listings pass an automated compliance check that can take up to 15 minutes. If the job is still pending afterwards, verify that your employer KYC is complete and flagged in green. Contact us with the job ID if the post remains hidden.",
  },
  {
    category: "account",
    question: "How can I delete my account?",
    answer:
      "From Account Settings choose Privacy → Delete Account. Confirm the action and your data will be scheduled for removal within 48 hours. You will receive a Resend confirmation email and a final reminder before the deletion is finalized.",
  },
  {
    category: "jobs",
    question: "Can I reopen a closed job?",
    answer:
      "Yes. Navigate to Employer Dashboard → Job History, select the closed posting, and choose Reopen. You can edit the listing before publishing and it will re-enter the matching pool instantly.",
  },
  {
    category: "chat",
    question: "How do I contact support?",
    answer:
      "You can start a live chat directly from this page, call our hotline, or drop us an email. For detailed escalations, submit the support ticket form below—our success team will respond within 12 working hours.",
  },
  {
    category: "billing",
    question: "Where can I download invoices for my billing cycle?",
    answer:
      "Invoices live inside Billing → History. Choose the cycle you need and click Download PDF. If you require a GST-compliant invoice or a corrected billing address, submit a ticket with the invoice ID.",
  },
  {
    category: "technical",
    question: "What should I do if the app is running slow?",
    answer:
      "Clear cached sessions, ensure WebSockets are permitted on your network, and try switching to the latest Chrome or Edge version. If latency persists, include your device details in a ticket so our engineers can trace it.",
  },
  {
    category: "mobile",
    question: "How do I enable push notifications on mobile?",
    answer:
      "Open the Norix app → Settings → Notifications and ensure system permissions are granted. iOS users may also need to enable Background Refresh. Changes sync instantly across devices linked to your account.",
  },
];

const supportChannels: SupportChannel[] = [
  {
    title: "Call Us",
    description: "Talk with a Norix specialist for urgent escalations or guided walkthroughs.",
    icon: Phone,
    actionLabel: "Call +1 (800) 555-6674",
    href: "tel:+18005556674",
    badge: "24/7 Priority",
  },
  {
    title: "Email Support",
    description: "Send us detailed logs, attachments, or compliance queries for tracked responses.",
    icon: Mail,
    actionLabel: "Email support@norix.ai",
    href: "mailto:support@norix.ai",
    badge: "Under 12h SLA",
  },
  {
    title: "Live Chat",
    description: "Connect with our success team inside the floating Norix chatbox for instant help.",
    icon: MessageCircle,
    actionLabel: "Start Chat",
    badge: "Instant",
  },
];

const ticketCategories = [
  { value: "account", label: "Account & Security" },
  { value: "jobs", label: "Jobs & Applications" },
  { value: "chat", label: "Chat & Messaging" },
  { value: "billing", label: "Billing & Payments" },
  { value: "technical", label: "Technical Support" },
  { value: "mobile", label: "Mobile Experience" },
  { value: "other", label: "Something Else" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const staggerChildren = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const CategoryCard = ({
  category,
  onSelect,
}: {
  category: HelpCategory;
  onSelect: (slug: string) => void;
}) => {
  const { icon: Icon } = category;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, translateY: -6 }}
      whileTap={{ scale: 0.98 }}
      variants={fadeInUp}
      className="group relative overflow-hidden rounded-2xl bg-white/80 p-6 text-left shadow-lg ring-1 ring-[#32A4A6]/15 transition-all duration-300 hover:ring-[#32A4A6]/40"
      onClick={() => onSelect(category.slug)}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/0 via-[#32A4A6]/10 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative z-10 inline-flex items-center gap-2 rounded-full bg-[#32A4A6]/10 px-3 py-1 text-xs font-semibold text-[#2A8B8E]">
        <LifeBuoy className="h-3.5 w-3.5" />
        {category.slug === "account" ? "Verified" : "Guided"}
      </span>
      <div className="relative z-10 mt-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#32A4A6]/15 text-[#2A8B8E] shadow-inner shadow-[#32A4A6]/20">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{category.description}</p>
        </div>
      </div>
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
        {category.highlights.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[#32A4A6]/15 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors group-hover:border-[#32A4A6]/30 group-hover:text-[#2A8B8E]"
          >
            {item}
          </span>
        ))}
      </div>
      <span className="relative z-10 mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#2A8B8E] transition-transform group-hover:translate-x-1">
        Explore resources
        <ArrowRight className="h-4 w-4" />
      </span>
    </motion.button>
  );
};

const FAQItem = ({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <motion.li
    key={faq.question}
    layout
    className="overflow-hidden rounded-2xl border border-[#32A4A6]/15 bg-white/80 shadow-lg backdrop-blur"
  >
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
    >
      <div>
        <p className="text-base font-semibold text-gray-900">{faq.question}</p>
        <p className="mt-1 text-xs uppercase tracking-widest text-[#2A8B8E]">
          {faq.category}
        </p>
      </div>
      <motion.div
        initial={false}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.25 }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#32A4A6]/15 text-[#2A8B8E]"
      >
        <ChevronDown className="h-5 w-5" />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="border-t border-[#32A4A6]/15 bg-white px-6"
        >
          <p className="py-5 text-sm leading-relaxed text-gray-600">
            {faq.answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.li>
);

export default function HelpAndSupportClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const router = useRouter();

  const filteredFaqs = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === "all" || faq.category === selectedCategory;
      const matchesSearch =
        !normalizedTerm ||
        faq.question.toLowerCase().includes(normalizedTerm) ||
        faq.answer.toLowerCase().includes(normalizedTerm);
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  const handleCategorySelect = useCallback((slug: string) => {
    setSelectedCategory(slug);
    setSearchTerm("");
    requestAnimationFrame(() => {
      const node = document.getElementById("faq-section");
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSelectedCategory("all");
      const node = document.getElementById("faq-section");
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    []
  );

  const handleOpenChat = useCallback(() => {
    if (typeof window === "undefined") return;
    const win = window as typeof window & {
      NorixChatbox?: { open?: () => void };
    };

    if (win.NorixChatbox?.open) {
      win.NorixChatbox.open();
      return;
    }

    window.dispatchEvent(new CustomEvent("norix:open-chatbox"));
  }, []);

  const handleSupportSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormState("submitting");

      const form = new FormData(event.currentTarget);
      const payload = {
        name: form.get("name"),
        email: form.get("email"),
        category: form.get("category"),
        message: form.get("message"),
      };

      console.info("[Help & Support] Ticket staged for Supabase:", payload);

      // Placeholder: integrate Supabase + Resend API here
      await new Promise((resolve) => setTimeout(resolve, 800));
      setFormState("success");
      event.currentTarget.reset();
      setUploadedFileName("");

      setTimeout(() => {
        setFormState("idle");
      }, 4000);
    },
    []
  );

  const renderFormFeedback = () => {
    if (formState === "success") {
      return (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Ticket captured successfully. You&apos;ll receive confirmation via Resend shortly.
        </div>
      );
    }

    if (formState === "error") {
      return (
        <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700">
          Something went wrong. Please try again or start a live chat.
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-[#f3fbfb] to-white text-gray-900">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-1/2 rounded-full bg-[#32A4A6]/8 blur-3xl" />
        <div className="absolute inset-x-0 top-[30%] mx-auto h-64 w-2/3 rounded-full bg-[#9ff0f1]/20 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mb-6 flex items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#32A4A6]/20 bg-white px-4 py-2 text-sm font-medium text-[#2A8B8E] shadow-sm transition hover:border-[#32A4A6]/40 hover:bg-[#f0fafa]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="relative overflow-hidden rounded-3xl border border-[#32A4A6]/15 bg-gradient-to-br from-white via-[#f0fbfb] to-white p-10 shadow-xl shadow-[#32A4A6]/10 backdrop-blur md:p-14"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 rounded-full border border-[#32A4A6]/20 bg-[#32A4A6]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2A8B8E]"
          >
            <LifeBuoy className="h-4 w-4 text-[#2A8B8E]" />
            NoriX Support Hub
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl"
          >
            Need Help with{" "}
            <span className="bg-gradient-to-r from-[#32A4A6] via-[#2A8B8E] to-[#32A4A6] bg-clip-text text-transparent">
              NoriX?
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mt-4 max-w-2xl text-lg text-gray-600 sm:text-xl"
          >
            Find answers, tutorials, or connect directly with our support
            engineers. Search common issues or jump into a live chat—support is
            always within reach.
          </motion.p>

          <motion.form
            onSubmit={handleSearchSubmit}
            variants={fadeInUp}
            className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2A8B8E]/40" />
              <input
                name="support-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search articles, keywords, or issues..."
                className="w-full rounded-2xl border border-[#32A4A6]/20 bg-white/80 px-12 py-4 text-sm text-gray-700 shadow-lg shadow-[#32A4A6]/10 outline-none transition focus:border-[#32A4A6] focus:bg-white focus:ring-2 focus:ring-[#32A4A6]/30"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#32A4A6] to-[#2A8B8E] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#32A4A6]/40 transition hover:shadow-xl hover:shadow-[#32A4A6]/50"
            >
              Quick Search
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.form>

          <motion.div
            variants={fadeInUp}
            className="mt-8 flex flex-wrap items-center gap-3 text-xs font-medium text-gray-600"
          >
            <span className="rounded-full border border-[#32A4A6]/20 bg-white px-3 py-1 uppercase tracking-[0.25em] text-[#2A8B8E]">
              Popular:
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("reset password");
                setSelectedCategory("account");
                document
                  .getElementById("faq-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-[#32A4A6]/20 bg-white px-3 py-1 transition hover:border-[#32A4A6]/40 hover:text-[#2A8B8E]"
            >
              Reset password
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("job posting");
                setSelectedCategory("jobs");
                document
                  .getElementById("faq-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-[#32A4A6]/20 bg-white px-3 py-1 transition hover:border-[#32A4A6]/40 hover:text-[#2A8B8E]"
            >
              Job publishing
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("billing");
                setSelectedCategory("billing");
                document
                  .getElementById("faq-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-[#32A4A6]/20 bg-white px-3 py-1 transition hover:border-[#32A4A6]/40 hover:text-[#2A8B8E]"
            >
              Invoice access
            </button>
          </motion.div>
        </motion.section>

        {/* Quick Nav */}
        <div className="mt-12 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="uppercase tracking-[0.2em] text-gray-400">
            Jump to:
          </span>
          <Link
            href="#categories"
            className="rounded-full border border-[#32A4A6]/20 bg-white px-4 py-2 transition hover:border-[#32A4A6]/50 hover:text-[#2A8B8E]"
          >
            Help Categories
          </Link>
          <Link
            href="#faq-section"
            className="rounded-full border border-[#32A4A6]/20 bg-white px-4 py-2 transition hover:border-[#32A4A6]/50 hover:text-[#2A8B8E]"
          >
            Popular FAQs
          </Link>
          <Link
            href="#contact"
            className="rounded-full border border-[#32A4A6]/20 bg-white px-4 py-2 transition hover:border-[#32A4A6]/50 hover:text-[#2A8B8E]"
          >
            Contact Support
          </Link>
          <Link
            href="#community"
            className="rounded-full border border-[#32A4A6]/20 bg-white px-4 py-2 transition hover:border-[#32A4A6]/50 hover:text-[#2A8B8E]"
          >
            Community & Feedback
          </Link>
          <Link
            href="#support-form"
            className="rounded-full border border-[#32A4A6]/20 bg-white px-4 py-2 transition hover:border-[#32A4A6]/50 hover:text-[#2A8B8E]"
          >
            Submit Ticket
          </Link>
        </div>

        {/* Categories */}
        <motion.section
          id="categories"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerChildren}
          className="mt-16 space-y-10"
        >
          <motion.div variants={fadeInUp} className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#32A4A6]/20 bg-[#32A4A6]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#2A8B8E]">
              Navigate faster
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <motion.h2 variants={fadeInUp} className="text-3xl font-bold">
                Help Categories
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="max-w-xl text-sm text-gray-600"
              >
                Choose a topic to filter FAQs instantly or deep-dive into
                tailored guides, video walkthroughs, and troubleshooting steps.
              </motion.p>
            </div>
          </motion.div>

          <motion.div
            variants={staggerChildren}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {helpCategories.map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                onSelect={(slug) => handleCategorySelect(slug)}
              />
            ))}
          </motion.div>
        </motion.section>

        {/* FAQs */}
        <motion.section
          id="faq-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerChildren}
          className="mt-24 space-y-10"
        >
          <motion.div
            variants={fadeInUp}
            className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#32A4A6]/20 bg-[#32A4A6]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#2A8B8E]">
                Popular FAQs
              </p>
              <h2 className="mt-3 text-3xl font-bold">Answers in seconds</h2>
              <p className="mt-2 max-w-xl text-sm text-gray-600">
                {filteredFaqs.length} result
                {filteredFaqs.length === 1 ? "" : "s"} found for your filters.
                Expand any item to reveal quick actions and extended guidance.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-[#32A4A6]/20 bg-white px-4 py-2 text-xs uppercase tracking-[0.35em] text-gray-500">
              Showing:
              <span className="rounded-full bg-[#32A4A6]/10 px-3 py-1 text-[#2A8B8E]">
                {selectedCategory === "all"
                  ? "All categories"
                  : selectedCategory}
              </span>
            </div>
          </motion.div>

          <motion.ul
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="space-y-4"
          >
            {filteredFaqs.map((faq) => {
              const isOpen = expandedFaq === faq.question;
              return (
                <FAQItem
                  key={faq.question}
                  faq={faq}
                  isOpen={isOpen}
                  onToggle={() =>
                    setExpandedFaq(isOpen ? null : faq.question)
                  }
                />
              );
            })}

            {filteredFaqs.length === 0 && (
              <motion.li
                variants={fadeInUp}
                className="rounded-3xl border border-[#32A4A6]/15 bg-white px-6 py-12 text-center text-sm text-gray-500"
              >
                Nothing matched your search yet. Try another keyword or submit a
                support ticket below.
              </motion.li>
            )}
          </motion.ul>
        </motion.section>

        {/* Contact Options */}
        <motion.section
          id="contact"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerChildren}
          className="mt-24 space-y-12"
        >
          <motion.div variants={fadeInUp} className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#32A4A6]/20 bg-[#32A4A6]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#2A8B8E]">
              Still need help?
            </p>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-bold">Contact & Support Options</h2>
                <p className="mt-2 max-w-2xl text-sm text-gray-600">
                  Reach out through the channel that works best for you. Our
                  support engineers collaborate in one dashboard, so you get
                  consistent answers regardless of entry point.
                </p>
              </div>
              <Link
                href="#support-form"
                className="inline-flex items-center gap-2 rounded-full border border-[#32A4A6]/40 bg-[#32A4A6]/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#2A8B8E] transition hover:border-[#32A4A6]/60 hover:bg-[#32A4A6]/15"
              >
                Create Support Ticket
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            variants={staggerChildren}
            className="grid gap-6 md:grid-cols-3"
          >
            {supportChannels.map((channel) => {
              const isLiveChat = channel.title === "Live Chat";
              return (
                <motion.div
                  key={channel.title}
                  variants={fadeInUp}
                  className="relative overflow-hidden rounded-3xl border border-[#32A4A6]/15 bg-white/80 p-6 shadow-xl transition hover:border-[#32A4A6]/40 hover:shadow-[#32A4A6]/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#32A4A6]/20 bg-[#32A4A6]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#2A8B8E]">
                      <channel.icon className="h-4 w-4" />
                      {channel.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-gray-900">
                    {channel.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {channel.description}
                  </p>
                  <div className="mt-6">
                    {isLiveChat ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenChat();
                        }}
                        className="w-full rounded-2xl bg-gradient-to-r from-[#32A4A6] to-[#2A8B8E] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#32A4A6]/40 transition hover:shadow-xl hover:shadow-[#32A4A6]/50"
                      >
                        {channel.actionLabel}
                      </button>
                    ) : (
                      <Link
                        href={channel.href ?? "#"}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#32A4A6]/20 bg-white px-4 py-3 text-sm font-semibold text-[#2A8B8E] transition hover:border-[#32A4A6]/40 hover:bg-[#f0fafa]"
                      >
                        {channel.actionLabel}
                      </Link>
                    )}
                  </div>
                  <div className="absolute -right-24 -bottom-20 h-48 w-48 rounded-full bg-[#32A4A6]/10 blur-3xl" />
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Community & Feedback */}
        <motion.section
          id="community"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerChildren}
          className="mt-24 grid gap-6 lg:grid-cols-2"
        >
          <motion.div
            variants={fadeInUp}
            className="relative overflow-hidden rounded-3xl border border-[#32A4A6]/15 bg-white/85 p-8 shadow-xl backdrop-blur"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#32A4A6]/20 bg-[#32A4A6]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#2A8B8E]">
              <Users className="h-4 w-4" />
              Community
            </span>
            <h3 className="mt-4 text-2xl font-semibold text-gray-900">
              Join the Norix Community
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Swap success stories, access peer-led playbooks, and beta-test
              upcoming releases. Our community moderators keep the space clean,
              supportive, and inclusive.
            </p>
            <Link
              href="https://community.norix.ai"
              target="_blank"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#32A4A6]/20 bg-white px-5 py-3 text-sm font-semibold text-[#2A8B8E] transition hover:border-[#32A4A6]/40 hover:bg-[#f0fafa]"
            >
              Join Community
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="absolute -right-12 -bottom-12 h-36 w-36 rounded-full bg-[#32A4A6]/10 blur-3xl" />
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="relative overflow-hidden rounded-3xl border border-[#32A4A6]/15 bg-white/85 p-8 shadow-xl backdrop-blur"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#32A4A6]/20 bg-[#32A4A6]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#2A8B8E]">
              <Sparkles className="h-4 w-4" />
              Feedback Loop
            </span>
            <h3 className="mt-4 text-2xl font-semibold text-gray-900">
              Request a Feature / Report a Bug
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Share your product ideas or flag an issue. We triage every note in
              Linear and keep you posted on progress through email updates.
            </p>
            <Link
              href="https://feedback.norix.ai"
              target="_blank"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#32A4A6] to-[#2A8B8E] px-5 py-3 text-sm font-semibold text-white transition hover:from-[#2A8B8E] hover:to-[#32A4A6]"
            >
              Open Feedback Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              {["Feature roadmap updates", "Bug triage within 48h", "Beta access priority"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#2A8B8E]" />
                    {item}
                  </li>
                )
              )}
            </ul>
            <div className="absolute -left-12 -bottom-16 h-32 w-32 rounded-full bg-[#32A4A6]/10 blur-3xl" />
          </motion.div>
        </motion.section>

        {/* Support Ticket Form */}
        <motion.section
          id="support-form"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="mt-24 rounded-3xl border border-[#32A4A6]/15 bg-white/90 p-8 shadow-2xl backdrop-blur lg:p-12"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#32A4A6]/20 bg-[#32A4A6]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#2A8B8E]">
                Priority queue
              </span>
              <h2 className="mt-4 text-3xl font-semibold text-gray-900">
                Support Ticket
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Drop detailed context for complex issues. Attach console logs,
                HAR files, or screenshots—we route them straight into Supabase
                storage and trigger workflow automations via Resend.
              </p>
            </div>
            <div className="rounded-2xl border border-[#32A4A6]/20 bg-white px-4 py-3 text-xs uppercase tracking-[0.25em] text-gray-500 shadow-inner shadow-[#32A4A6]/15">
              Average reply: <span className="font-semibold text-gray-900">7h</span>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {renderFormFeedback()}

            <form
              onSubmit={handleSupportSubmit}
              className="grid gap-6 md:grid-cols-2"
            >
              <label className="flex flex-col gap-2 text-sm text-gray-600">
                Full Name
                <input
                  name="name"
                  required
                  placeholder="e.g. Priya Sharma"
                  className="rounded-2xl border border-[#32A4A6]/20 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner shadow-[#32A4A6]/10 outline-none transition focus:border-[#32A4A6] focus:ring-2 focus:ring-[#32A4A6]/30"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-gray-600">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@norix.ai"
                  className="rounded-2xl border border-[#32A4A6]/20 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner shadow-[#32A4A6]/10 outline-none transition focus:border-[#32A4A6] focus:ring-2 focus:ring-[#32A4A6]/30"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-gray-600">
                Category
                <select
                  name="category"
                  required
                  defaultValue=""
                  className="rounded-2xl border border-[#32A4A6]/20 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner shadow-[#32A4A6]/10 outline-none transition focus:border-[#32A4A6] focus:ring-2 focus:ring-[#32A4A6]/30"
                >
                  <option value="" disabled className="bg-white text-gray-500">
                    Select issue type
                  </option>
                  {ticketCategories.map((category) => (
                    <option
                      key={category.value}
                      value={category.value}
                      className="bg-white text-gray-700"
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-gray-600">
                Attachments
                <div className="flex h-full items-center justify-between gap-3 rounded-2xl border border-dashed border-[#32A4A6]/25 bg-white px-4 py-3 text-sm text-gray-500">
                  <div className="flex items-center gap-3">
                    <UploadCloud className="h-5 w-5 text-[#2A8B8E]" />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700">
                        {uploadedFileName || "Add files"}
                      </span>
                      <span className="text-xs text-gray-400">
                        HAR, PNG, PDF up to 15MB
                      </span>
                    </div>
                  </div>
                  <label className="cursor-pointer rounded-xl border border-[#32A4A6]/20 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#2A8B8E] transition hover:border-[#32A4A6]/40 hover:bg-[#f0fafa]">
                    Upload
                    <input
                      name="file"
                      type="file"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        setUploadedFileName(file ? file.name : "");
                      }}
                    />
                  </label>
                </div>
              </label>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm text-gray-600">
                Message
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Describe the issue. Include timelines, device/browser details, and any relevant job or user IDs."
                  className="rounded-2xl border border-[#32A4A6]/20 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner shadow-[#32A4A6]/10 outline-none transition focus:border-[#32A4A6] focus:ring-2 focus:ring-[#32A4A6]/30"
                />
              </label>

              <div className="md:col-span-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 className="h-4 w-4 text-[#2A8B8E]" />
                  Securely stored in Supabase EU region. PII redaction enabled.
                </div>
                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#32A4A6] to-[#2A8B8E] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#32A4A6]/40 transition hover:shadow-xl hover:shadow-[#32A4A6]/50 disabled:cursor-wait disabled:opacity-60"
                >
                  {formState === "submitting" ? "Submitting..." : "Submit Ticket"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </motion.section>

        {/* Footer Links */}
        <section className="mt-24">
          <div className="rounded-3xl border border-[#32A4A6]/20 bg-white px-6 py-6 text-center text-sm text-gray-600 shadow-lg backdrop-blur">
            <span className="text-gray-500">Resources:</span>{" "}
            <Link
              href="/privacy-policy"
              className="mx-2 text-[#2A8B8E] transition hover:text-[#1f6c6e]"
            >
              Privacy Policy
            </Link>
            |
            <Link
              href="/terms"
              className="mx-2 text-[#2A8B8E] transition hover:text-[#1f6c6e]"
            >
              Terms
            </Link>
            |
            <Link
              href="#support-form"
              className="mx-2 text-[#2A8B8E] transition hover:text-[#1f6c6e]"
            >
              Feedback
            </Link>
            |
            <Link
              href="#contact"
              className="mx-2 text-[#2A8B8E] transition hover:text-[#1f6c6e]"
            >
              Contact
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

