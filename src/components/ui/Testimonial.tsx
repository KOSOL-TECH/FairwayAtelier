import { cx } from './cx';

export interface TestimonialProps {
  quote?: string;
  name?: string;
  /** Secondary line under the name (journey, date, city) */
  detail?: string;
  align?: 'center' | 'left';
}

export function Testimonial({ quote, name, detail, align = 'center' }: TestimonialProps) {
  return (
    <figure className={cx('fa-testimonial', align === 'left' && 'fa-testimonial--left')}>
      <span className="fa-testimonial__mark" aria-hidden="true">&ldquo;</span>
      <blockquote>{quote}</blockquote>
      <figcaption>
        <span className="fa-testimonial__rule" aria-hidden="true" />
        <div className="fa-testimonial__name">{name}</div>
        {detail && <div className="fa-testimonial__detail">{detail}</div>}
      </figcaption>
    </figure>
  );
}
