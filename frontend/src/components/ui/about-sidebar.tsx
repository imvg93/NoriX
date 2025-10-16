"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function AboutSidebar({ className }: SidebarProps) {
  const [activeSection, setActiveSection] = useState("about");

  const sections = [
    { id: "about", name: "About NoriX", href: "#about" },
    { id: "mission", name: "Our Mission", href: "#mission" },
    { id: "stats", name: "Our Impact", href: "#stats" },
    { id: "story", name: "Our Story", href: "#story" },
    { id: "values", name: "Our Values", href: "#values" },
    { id: "team", name: "Our Team", href: "#team" },
    { id: "contact", name: "Get Started", href: "#contact" },
  ];

  return (
    <div className={cn("w-64 bg-white border-r border-gray-200 h-screen sticky top-0", className)}>
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-8">
          <div className="relative h-10 w-32">
            <Image
              src="/img/norixwhite.png"
              alt="NoriX logo"
              fill
              sizes="128px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Page Sections
          </h3>
          {sections.map((section) => (
            <a
              key={section.id}
              href={section.href}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeSection === section.id
                  ? "bg-green-50 text-green-700 border-l-4 border-green-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {section.name}
            </a>
          ))}
        </nav>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-2">
            <p className="font-medium text-gray-700">Quick Stats</p>
            <div className="space-y-1">
              <p>• 5+ Years Experience</p>
              <p>• 10,000+ Projects</p>
              <p>• 50+ Cities</p>
              <p>• 98% Satisfaction</p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-6">
          <a
            href="/login"
            className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
