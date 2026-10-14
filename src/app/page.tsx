"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SessionData, FileMetadata, PrintPreferences } from "@/lib/types";
import {
  createSession,
  restoreSession,
  deleteSession,
  subscribeToSession,
} from "@/lib/session-client";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionFeaturesSection } from "@/components/landing/SolutionFeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";
import { CodeView } from "@/views/CodeView";
import { SuccessView } from "@/views/SuccessView";
import { WavesShaderBackground } from "@/components/WavesShaderBackground";


type StudentStep = "UPLOAD" | "CODE" | "SUCCESS";

export default function StudentPage() {
  const [step, setStep] = useState<StudentStep>("UPLOAD");
  const [session, setSession] = useState<SessionData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreSession()
      .then((s) => {
        if (s) {
          setSession(s);
          setStep(["DELETED", "EXPIRED"].includes(s.status) ? "SUCCESS" : "CODE");
        }
      })
      .catch(() => {});
  }, []);

  // Subscribe to real-time session changes (e.g. operator accesses or deletes file)
  useEffect(() => {
    if (!session?.id) return;

    const unsubscribe = subscribeToSession(
      session.id,
      (updated) => {
        if (!updated) return;
        setError(null);
        setSession(updated);

        if (updated.status === "DELETED" || updated.status === "EXPIRED") {
          setStep("SUCCESS");
        }
      },
      setError
    );

    return () => unsubscribe();
  }, [session?.id]);

  const handleGenerateCode = async (
    files: FileMetadata[],
    preferences: PrintPreferences,
    shop?: { id: string; name: string }
  ) => {
    setIsGenerating(true);
    setUploadProgress(0);
    setError(null);
    try {
      const s = await createSession(files, preferences, setUploadProgress, shop);
      setSession(s);
      setStep("CODE");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!session) return;
    setIsRevoking(true);
    setError(null);
    try {
      setSession(await deleteSession(session.id));
      setStep("SUCCESS");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem("zdrop-session");
    setSession(null);
    setError(null);
    setStep("UPLOAD");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[var(--canvas)] text-[var(--text-primary)] transition-colors duration-200 overflow-x-hidden">
      {/* Animated WebGL "Waves" Shader Background */}
      <WavesShaderBackground />

      {/* Dynamic Multi-Stop Atmospheric Gradient Background Combo */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">

        {/* Upper Celestial Aurora (Electric Blue, Radiant Cyan & Celestial Indigo) */}
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[1400px] h-[750px] rounded-full blur-[140px] opacity-75 dark:opacity-45 bg-gradient-to-tr from-blue-500/25 via-cyan-400/30 to-indigo-500/20 dark:from-blue-600/30 dark:via-cyan-500/25 dark:to-indigo-600/20" />

        {/* Mid-Left Atmospheric Bloom (Luminous Azure / Deep Sapphire) */}
        <div className="absolute top-[35%] -left-[200px] w-[850px] h-[850px] rounded-full blur-[160px] opacity-60 dark:opacity-25 bg-gradient-to-br from-cyan-400/25 via-blue-500/20 to-transparent dark:from-cyan-500/25 dark:via-blue-600/15 dark:to-transparent" />

        {/* Mid-Right Accent Bloom (Ultra Indigo / Violet Depth) */}
        <div className="absolute top-[55%] -right-[220px] w-[850px] h-[850px] rounded-full blur-[160px] opacity-55 dark:opacity-25 bg-gradient-to-bl from-indigo-500/20 via-blue-600/15 to-transparent dark:from-indigo-600/25 dark:via-cyan-600/15 dark:to-transparent" />

        {/* Bottom Horizon Bloom (Cyan & Emerald Zero-Trace Security Aura) */}
        <div className="absolute -bottom-[10%] left-1/2 -translate-x-1/2 w-[1300px] h-[650px] rounded-full blur-[150px] opacity-70 dark:opacity-35 bg-gradient-to-t from-blue-500/25 via-cyan-400/20 to-emerald-400/15 dark:from-cyan-900/35 dark:via-blue-900/25 dark:to-emerald-950/20" />

        {/* Subtle Technical Dot Matrix Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.04)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] opacity-80" />
      </div>

      <Navbar currentRole="student" />

      <main className="flex-1 pt-20 sm:pt-24">
        {error && (
          <div className="max-w-md mx-auto my-4 px-4">
            <p
              role="alert"
              className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/30 rounded-xl text-center"
            >
              {error}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "UPLOAD" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* 1. Hero Section (Formula: [End result] + [Without fear] + live dropzone) */}
              <HeroSection
                onGenerateCode={handleGenerateCode}
                isGenerating={isGenerating}
                uploadProgress={uploadProgress}
              />

              {/* 2. Problem Statement Section (Formula: [Show what they face] + [Make them feel real cost]) */}
              <ProblemSection />

              {/* 3. Solution / Value Section (6 features in [Feature] + [Benefit] + [Visual] formula) */}
              <SolutionFeaturesSection />

              {/* 4. How It Works Section (4 simple steps) */}
              <HowItWorksSection />

              {/* 5. FAQs Section (Accordion addressing objections) */}
              <FaqSection />

              {/* 6. CTA Section (Formula: [Benefit-driven headline] + [The CTA]) */}
              <CtaSection />
            </motion.div>
          )}

          {step === "CODE" && session && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="py-6"
            >
              <CodeView
                session={session}
                onRevokeSession={handleRevokeSession}
                onBackToUpload={() => setStep("UPLOAD")}
                isRevoking={isRevoking}
              />
            </motion.div>
          )}

          {step === "SUCCESS" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="py-6"
            >
              <SuccessView session={session} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 7. Footer Component */}
      <Footer />
    </div>
  );
}
