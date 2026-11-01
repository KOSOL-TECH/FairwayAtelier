export interface CookieConsentProps {
  /** Navigate to a page (used for the Cookie policy link) */
  onNav?: (page: string) => void;
}
export declare function CookieConsent(props: CookieConsentProps): JSX.Element;
