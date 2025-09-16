"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimelineContentProps {
  as?: React.ElementType;
  animationNum: number;
  timelineRef: React.RefObject<HTMLElement | null>;
  customVariants?: any;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

export function TimelineContent({
  as: Component = "div",
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}: TimelineContentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  const defaultVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: 20,
      opacity: 0,
    },
  };

  const variants = customVariants || defaultVariants;

  // Use motion.div for all components to avoid TypeScript complexity
  const MotionComponent = motion.div;

  return (
    <MotionComponent
      ref={elementRef as any}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={variants}
      custom={animationNum}
      className={cn(className)}
      style={{ textDecoration: 'none' }}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
