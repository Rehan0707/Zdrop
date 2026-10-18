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


type CustomerStep = "UPLOAD" | "CODE" | "SUCCESS";

export default function CustomerPage() {
  const [step, setStep] = useState<CustomerStep>("UPLOAD");
  const [session, setSession] = useState<SessionData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
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
      .catch(error => setError((error as Error).message))
      .finally(() => setIsRestoring(false));
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
    <div className="zd-app">
      <Navbar currentRole="customer" showSections={step === "UPLOAD"} />

      <main id="main-content" className="zd-main">
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
                isRestoring={isRestoring}
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
                onSessionUpdated={setSession}
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
