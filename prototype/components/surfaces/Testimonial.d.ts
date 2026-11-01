export interface TestimonialProps {
  quote?: string;
  name?: string;
  /** Secondary line under the name (journey, date, city) */
  detail?: string;
  align?: 'center' | 'left';
}
export declare function Testimonial(props: TestimonialProps): JSX.Element;
