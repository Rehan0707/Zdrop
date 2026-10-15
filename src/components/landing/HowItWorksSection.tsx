import { UploadCloud, Hash, Printer, Check } from "lucide-react";
const steps = [
  {
    title: "Drop your files",
    text: "Choose your documents, sign in, and set how you want them printed.",
    icon: UploadCloud,
  },
  {
    title: "Get your code",
    text: "Keep the six-digit code or QR open on your phone.",
    icon: Hash,
  },
  {
    title: "Meet the printer",
    text: "The shop enters your six-digit code or scans your ZDrop job QR to open the job.",
    icon: Printer,
  },
  {
    title: "Finish the handoff",
    text: "The operator confirms printing and deletes the files from ZDrop.",
    icon: Check,
  },
];
export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="zd-below zd-how">
      <div className="zd-container">
        <div className="zd-below-heading">
          <p className="zd-eyebrow">Phone to paper</p>
          <h2>
            Four steps.
            <br />
            One clean handoff.
          </h2>
        </div>
        <ol className="zd-how-steps">
          {steps.map(({ title, text, icon: Icon }, index) => (
            <li key={title}>
              <div className="zd-step-top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon size={24} strokeWidth={1.5} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
