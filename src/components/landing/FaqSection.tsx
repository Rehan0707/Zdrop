"use client";
import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
const faqs = [
  {
    question: "Does the print shop need an app?",
    answer:
      "No. The operator opens the ZDrop kiosk in a browser, then enters your six-digit code or scans the ZDrop job QR with the kiosk camera.",
  },
  {
    question: "When are my files deleted?",
    answer:
      "Your code expires 15 minutes after upload completes. Expired files are removed during cleanup. You can delete your session sooner, and the operator can confirm printing and delete the job.",
  },
  {
    question: "Can the operator save a copy?",
    answer:
      "The operator receives your files to print them, so a browser cannot prevent saved copies. Deleting a session removes ZDrop’s stored copy, including access through your code. Choose a shop you trust.",
  },
  {
    question: "What can I upload?",
    answer:
      "Up to three PDF, DOCX, JPG, or PNG files, each up to 25 MiB. PDFs and images have browser previews. DOCX files open in a compatible document app for printing.",
  },
  {
    question: "Do I need to sign in?",
    answer:
      "The current version uses Google sign-in to upload documents. You can select files and choose settings first; no files are sent until you are signed in and request a print code.",
  },
];
export function FaqSection() {
  const id = useId();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="zd-below">
      <div className="zd-container zd-faq-grid">
        <div>
          <p className="zd-eyebrow">A few good questions</p>
          <h2>
            Before you
            <br />
            hit print.
          </h2>
          <p>The practical details, so you know what to expect.</p>
        </div>
        <div>
          {faqs.map((faq, index) => (
            <div className="zd-faq-item" key={faq.question}>
              <h3>
                <button
                  type="button"
                  aria-expanded={open === index}
                  aria-controls={`${id}-answer-${index}`}
                  id={`${id}-question-${index}`}
                  onClick={() => setOpen(open === index ? null : index)}
                >
                  <span>{faq.question}</span>
                  {open === index ? <Minus size={19} /> : <Plus size={19} />}
                </button>
              </h3>
              <div
                role="region"
                id={`${id}-answer-${index}`}
                aria-labelledby={`${id}-question-${index}`}
                hidden={open !== index}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
