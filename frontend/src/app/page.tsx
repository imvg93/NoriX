"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import EmployerView from "./employer/page";
import StudentHome from "@/components/StudentHome";

const ACCENT = "#4C3DFF";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();

  const roleView = useMemo(() => {
    if (!isAuthenticated || !user) return null;
    if (user.userType === "employer") return "employer";
    if (user.userType === "student") return <StudentHome user={user} />;
    if (user.userType === "admin") return <AdminHome />;
    return null;
  }, [isAuthenticated, user]);

  // Employer: render dedicated employer experience inline at root
  if (roleView === "employer" && !loading) {
    return <EmployerView />;
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      {/* Non-employer role views (student/admin) */}
      {roleView && roleView !== "employer" && !loading ? (
        roleView
      ) : (
        // Public marketing view (unauthenticated) - New Landing Page Design
        <div className="min-h-screen flex flex-col">
          {/* Hero Section */}
          <main className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
              <div className="max-w-4xl">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-indigo-900 mb-6">
                  Verified students. Controlled hiring.
                </h1>
                <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-2xl font-medium">
                  Verified profiles, approval-first workflows, and secure payments – built for real work.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center px-8 py-4 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="inline-flex items-center px-8 py-4 text-base font-semibold text-indigo-600 bg-white border-2 border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    How it works
                  </Link>
                </div>
              </div>
            </div>
          </main>

          {/* Why Norix Exists Section */}
          <section className="bg-white py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
                Hiring students is risky. We remove that risk.
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                {/* Left: Problems */}
                <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 lg:p-8 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-700 mb-6">Problems</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-gray-500 text-xl font-bold mt-0.5 flex-shrink-0">×</span>
                      <span className="text-gray-900 font-semibold">Fake or unverified candidates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gray-500 text-xl font-bold mt-0.5 flex-shrink-0">×</span>
                      <span className="text-gray-900 font-semibold">No accountability after work starts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gray-500 text-xl font-bold mt-0.5 flex-shrink-0">×</span>
                      <span className="text-gray-900 font-semibold">Payment disputes and delays</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gray-500 text-xl font-bold mt-0.5 flex-shrink-0">×</span>
                      <span className="text-gray-900 font-semibold">No clear approval control</span>
                    </li>
                  </ul>
                </div>

                {/* Right: Norix Fix */}
                <div className="bg-indigo-50 rounded-xl border-2 border-indigo-200 p-6 lg:p-8 shadow-lg">
                  <h3 className="text-lg font-bold text-indigo-600 mb-6">Norix Fix</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-indigo-600 text-xl font-bold mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-gray-900 font-semibold">Verified student identities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-indigo-600 text-xl font-bold mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-gray-900 font-semibold">Approval-before-payment workflow</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-indigo-600 text-xl font-bold mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-gray-900 font-semibold">Escrow-based payments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-indigo-600 text-xl font-bold mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-gray-900 font-semibold">Role-based access control</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Who Is This For Section */}
          <section className="bg-white py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
                Who is this for?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {/* Students Card */}
                <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold text-indigo-600 mb-6">Students</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Access verified work
                    </li>
                    <li className="text-gray-700 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Real experience, real pay
                    </li>
                    <li className="text-gray-700 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Transparent workflow
                    </li>
                  </ul>
                </div>

                {/* Employers Card */}
                <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold text-indigo-600 mb-6">Employers</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Hire without risk
                    </li>
                    <li className="text-gray-700 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Approve before paying
                    </li>
                    <li className="text-gray-700 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Full control, no chaos
                    </li>
                  </ul>
                </div>

                {/* Admins / Institutions Card */}
                <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold text-indigo-600 mb-6">Admins / Institutions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Central oversight
                    </li>
                    <li className="text-gray-700 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Compliance-friendly
                    </li>
                    <li className="text-gray-700 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Scalable workforce management
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Additional Content Sections */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-20">

            {/* How it works */}
            <section className="space-y-8 bg-white py-12">
              <h2 className="text-3xl font-bold leading-tight text-gray-900">How it works</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-sm font-semibold text-indigo-600 mb-3">Step 1</div>
                  <p className="text-lg font-bold text-gray-900">Post or assign work</p>
                </div>
                <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-sm font-semibold text-indigo-600 mb-3">Step 2</div>
                  <p className="text-lg font-bold text-gray-900">Verified student completes task</p>
                </div>
                <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-sm font-semibold text-indigo-600 mb-3">Step 3</div>
                  <p className="text-lg font-bold text-gray-900">Approve → Payment released</p>
                </div>
              </div>
            </section>

            {/* Trust & Control */}
            <section className="bg-gray-50 py-16 lg:py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
                  Trust & Control
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* KYC-verified users */}
                  <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-indigo-600 text-2xl font-bold mb-3">✓</div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">KYC-verified users</h3>
                    <p className="text-sm text-gray-600">Identity and enrollment verified before access</p>
                  </div>

                  {/* Approval-first system */}
                  <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-indigo-600 text-2xl font-bold mb-3">✓</div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Approval-first system</h3>
                    <p className="text-sm text-gray-600">Work starts only after employer approval</p>
                  </div>

                  {/* Escrow-secured payments */}
                  <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-indigo-600 text-2xl font-bold mb-3">$</div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Escrow-secured payments</h3>
                    <p className="text-sm text-gray-600">Funds held until work approved</p>
                  </div>

                  {/* Activity visibility */}
                  <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-indigo-600 text-2xl font-bold mb-3">✓</div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Activity visibility</h3>
                    <p className="text-sm text-gray-600">Full transparency, not surveillance</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Why Norix Is Different */}
            <section className="bg-white py-16 lg:py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
                  Why Norix is Different
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                  <div className="bg-white border-l-4 border-indigo-600 rounded-lg pl-6 py-6 shadow-md hover:shadow-lg transition-shadow">
                    <p className="text-lg font-bold text-gray-900">Built for approval, not assumption</p>
                  </div>
                  
                  <div className="bg-white border-l-4 border-indigo-600 rounded-lg pl-6 py-6 shadow-md hover:shadow-lg transition-shadow">
                    <p className="text-lg font-bold text-gray-900">Payments released only after confirmation</p>
                  </div>
                  
                  <div className="bg-white border-l-4 border-indigo-600 rounded-lg pl-6 py-6 shadow-md hover:shadow-lg transition-shadow">
                    <p className="text-lg font-bold text-gray-900">Designed for controlled hiring, not chaos</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Final CTA */}
            <section className="bg-indigo-600 py-16 lg:py-24">
              <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Start with verified work.
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white mb-8">
                  Build trust from day one.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center px-8 py-4 text-base font-semibold text-indigo-600 bg-white hover:bg-gray-50 rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="text-sm font-medium text-white hover:text-indigo-100 underline-offset-4 hover:underline"
                  >
                    See how it works
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}


function AdminHome() {
  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-12 py-16 lg:py-24 space-y-16">
      <section className="flex flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#475569]">Admin view</p>
        <h1 className="text-5xl font-extrabold leading-[1.05] text-[#0F172A]">Operations and oversight.</h1>
        <p className="text-lg text-[#1F2937] max-w-2xl">
          Monitor verifications, manage employers and students, and keep the system healthy.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/dashboard"
            className="rounded-xl bg-[var(--accent-color,#4C3DFF)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#3F34CC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-color,#4C3DFF)]"
            style={{ ["--accent-color" as string]: ACCENT }}
          >
            Admin Dashboard
          </Link>
          <Link
            href="/kyc-management"
            className="rounded-xl border border-[#E4E7EC] bg-white px-6 py-3 text-base font-semibold text-[#0F172A] hover:bg-[#F7F8FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B5563]"
          >
            KYC Management
          </Link>
        </div>
      </section>
    </div>
  );
}


