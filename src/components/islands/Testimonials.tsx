import { useState } from 'react';
import { Testimonial, type TestimonialProps } from '../ui/Testimonial';

export interface TestimonialsProps {
  voices: Array<Required<Pick<TestimonialProps, 'quote' | 'name' | 'detail'>>>;
}

/** Home "In Their Words": one quote at a time, chosen with the diamond pager. */
export function Testimonials({ voices }: TestimonialsProps) {
  const [voice, setVoice] = useState(0);
  const v = voices[voice];
  return (
    <>
      <div className="voices__stage" aria-live="polite">
        <Testimonial quote={v.quote} name={v.name} detail={v.detail} />
      </div>
      <div className="voices__pager">
        {voices.map((_, i) => (
          <button key={i} type="button" className="voices__dot" aria-label={`Guest ${i + 1}`}
            aria-pressed={i === voice} onClick={() => setVoice(i)} />
        ))}
      </div>
    </>
  );
}
