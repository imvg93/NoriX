import type { Metadata } from "next";
import HelpAndSupportClient from "./HelpAndSupportClient";

export const metadata: Metadata = {
  title: "Help & Support | NoriX",
  description:
    "Get immediate support, browse FAQs, and connect with the NoriX team for account, billing, technical, and product assistance.",
  keywords: [
    "Norix help",
    "Norix support",
    "customer service",
    "Norix FAQ",
    "Norix contact",
  ],
  openGraph: {
    title: "Help & Support | NoriX",
    description:
      "Access tutorials, FAQs, and direct support from the NoriX team whenever you need help.",
    url: "https://norix.ai/help-and-support",
    siteName: "NoriX",
    type: "website",
  },
  alternates: {
    canonical: "/help-and-support",
  },
};

export default function HelpAndSupportPage() {
  return <HelpAndSupportClient />;
}

