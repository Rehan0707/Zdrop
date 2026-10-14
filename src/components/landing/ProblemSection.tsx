import { Hash, SlidersHorizontal, Clock3 } from "lucide-react";
export function ProblemSection() {
  return (
    <section className="zd-benefits-strip" aria-label="A simpler print handoff">
      <div className="zd-container zd-benefits">
        <article>
          <Hash size={21} />
          <div>
            <h2>Skip the contact swap.</h2>
            <p>Share a temporary code instead of your number or email.</p>
          </div>
        </article>
        <article>
          <SlidersHorizontal size={21} />
          <div>
            <h2>Make the details clear.</h2>
            <p>Copies, color, sides, and pages travel with your files.</p>
          </div>
        </article>
        <article>
          <Clock3 size={21} />
          <div>
            <h2>Know when you’re done.</h2>
            <p>Follow the session and see when your files leave ZDrop.</p>
          </div>
        </article>
      </div>
    </section>
  );
}
