import { ArrowRight } from "lucide-react";
export function CtaSection() {
  return (
    <section className="zd-cta">
      <div className="zd-container zd-cta-inner">
        <div>
          <h2>Let’s put it on paper.</h2>
          <p>A document on your phone. A code at the counter.</p>
        </div>
        <a href="#upload" className="zd-button">
          Start a print job <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
