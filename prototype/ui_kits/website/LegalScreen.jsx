function LegalPage({ eyebrow, title, updated, children }) {
  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '72px 40px 96px' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>{eyebrow}</div>
      </div>
      <h1 style={{ fontSize: 'var(--text-display-lg)', textAlign: 'center', margin: '14px 0 10px' }}>{title}</h1>
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>Last updated {updated}</p>
      <div style={{ width: 40, height: 1, background: 'var(--accent)', margin: '24px auto 40px' }}></div>
      <div>{children}</div>
    </main>
  );
}
const H = ({ children }) => <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-sm)', color: 'var(--text-heading)', margin: '36px 0 12px' }}>{children}</h2>;
const P = ({ children }) => <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 'var(--leading-body)', color: 'var(--text-body)', margin: '0 0 14px' }}>{children}</p>;
const Row = ({ k, v }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, padding: '12px 0', borderTop: '1px solid var(--border-hairline)' }}>
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>{k}</span>
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-body)' }}>{v}</span>
  </div>
);
const Placeholder = ({ children }) => (
  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontStyle: 'italic', color: 'var(--text-muted)', background: 'var(--surface-tint)', borderLeft: '2px solid var(--accent)', padding: '10px 14px', margin: '0 0 20px' }}>{children}</p>
);

function MentionsLegalesScreen() {
  return (
    <LegalPage eyebrow="Legal" title="Mentions légales" updated="July 2026">
      <Placeholder>Draft for review by French counsel before launch. Registration numbers below are placeholders.</Placeholder>
      <P>In accordance with Article 6 of French Law No. 2004-575 of 21 June 2004 (LCEN), the following information is provided to users of this website.</P>
      <H>Publisher</H>
      <Row k="Company" v="Fairway Atelier SAS" />
      <Row k="Legal form" v="Société par actions simplifiée (SAS)" />
      <Row k="Share capital" v="€XX,000" />
      <Row k="Registered office" v="[Street], Dinard, 35800, France" />
      <Row k="RCS / SIREN" v="RCS Saint-Malo XXX XXX XXX" />
      <Row k="VAT (TVA)" v="FR XX XXX XXX XXX" />
      <Row k="Travel licence" v="Atout France IM0XX2600XX" />
      <Row k="Financial guarantee" v="[Guarantor], per Art. L.211-18 Code du tourisme" />
      <Row k="Professional insurance" v="[Insurer], [policy no.]" />
      <Row k="Publication director" v="[Name], President" />
      <Row k="Contact" v="atelier@fairwayatelier.com" />
      <H>Hosting</H>
      <P>This website is hosted by [Host name], [address], [contact]. All servers are located within the European Union.</P>
      <H>Intellectual property</H>
      <P>All content — text, images, logos, and the Fairway Atelier name and crest — is the property of Fairway Atelier SAS or its licensors and may not be reproduced without prior written consent.</P>
    </LegalPage>
  );
}

function PrivacyScreen({ onNav }) {
  return (
    <LegalPage eyebrow="Legal" title="Privacy policy" updated="July 2026">
      <Placeholder>GDPR-aligned draft for review by counsel/DPO before launch.</Placeholder>
      <P>Fairway Atelier SAS ("we") is the data controller for personal data collected through this website, in accordance with the EU General Data Protection Regulation (GDPR) and the French Loi Informatique et Libertés.</P>
      <H>What we collect</H>
      <P>Only what you provide when you enquire: your name, email, phone, dates and group composition, tier interest, and any notes you choose to share (such as dietary needs or handicap). We collect no more than is necessary to arrange your consultation call.</P>
      <H>Why we use it</H>
      <P>To respond to your enquiry, arrange and conduct your consultation call, build your preference profile, and — only with your consent — to understand aggregate, anonymous site usage. We do not sell personal data, and we do not use it for automated profiling or advertising.</P>
      <H>Lawful basis</H>
      <P>Enquiries: performance of pre-contractual steps at your request and our legitimate interest in responding. Analytics: your consent, which you may withdraw at any time via our <a href="#" onClick={(e) => { e.preventDefault(); onNav && onNav('Cookies'); }} style={{ color: 'var(--accent)' }}>cookie preferences</a>.</P>
      <H>Retention</H>
      <P>Enquiry data is kept for the duration of our conversation and, where a journey proceeds, for the period required by French tax and tourism law. Otherwise it is deleted within [XX] months.</P>
      <H>Your rights</H>
      <P>You have the right to access, rectify, erase, restrict, and port your data, and to object to processing. To exercise these rights, or to lodge a complaint, contact atelier@fairwayatelier.com. You may also complain to the CNIL (www.cnil.fr).</P>
      <H>Analytics</H>
      <P>We use privacy-respecting analytics (such as Plausible, Fathom, or Matomo) that do not set advertising cookies or track you across sites. We do not use Google Analytics.</P>
    </LegalPage>
  );
}

function TermsScreen() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of booking — CGV" updated="July 2026">
      <Placeholder>Conditions Générales de Vente — draft for review by French travel-law counsel before launch.</Placeholder>
      <P>These conditions govern the sale of travel services by Fairway Atelier SAS (Atout France IM0XX2600XX) and apply in addition to Articles L.211-1 et seq. of the French Code du tourisme.</P>
      <H>Enquiry and consultation</H>
      <P>No sum is collected through this website. A journey is arranged only after a consultation call and the issue of a written, personalised proposal. A contract is formed when you accept that proposal in writing and pay the agreed deposit.</P>
      <H>Pricing</H>
      <P>All journeys are bespoke and priced on request; the price confirmed in your proposal prevails. Flights are not included and, where arranged at your request, are billed separately at cost plus a stated handling fee.</P>
      <H>Payment schedule</H>
      <P>[Deposit %] on confirmation; the balance due [XX] days before departure. Payment terms are set out in full in your individual proposal.</P>
      <H>Changes and cancellation</H>
      <P>Cancellation terms follow the schedule in your proposal and the Code du tourisme. Because named restaurants, hotels, and courses are held on your behalf, cancellation charges reflect commitments already made to our partners.</P>
      <H>Named inclusions</H>
      <P>Named restaurants, hotels, and courses are illustrative of the experience we curate. Final inclusions are confirmed during your consultation and in your written proposal, and remain subject to availability.</P>
      <H>Liability and guarantee</H>
      <P>We hold the financial guarantee and professional liability insurance required of a French travel operator. Full details appear in the Mentions légales.</P>
    </LegalPage>
  );
}

function CookiesScreen() {
  return (
    <LegalPage eyebrow="Legal" title="Cookie policy" updated="July 2026">
      <Placeholder>Draft for review before launch. Cookie table to be completed once analytics vendor is finalised.</Placeholder>
      <P>This site uses a minimal set of cookies. In line with CNIL guidance, non-essential cookies are set only with your consent, and refusing is as easy as accepting. You can change your choice at any time using the banner, which reappears when you clear your saved preference.</P>
      <H>Strictly necessary</H>
      <P>Required for the site to function and to remember your cookie choice. These are always active and cannot be switched off. They store no marketing or profiling data.</P>
      <H>Analytics (optional, off by default)</H>
      <P>With your consent, we use a privacy-respecting analytics tool (Plausible, Fathom, or Matomo) that measures aggregate, anonymous usage. It sets no advertising cookies and does not track you across other websites. We do not use Google Analytics.</P>
      <H>Managing your choice</H>
      <P>Use "Manage preferences" in the cookie banner to accept or refuse analytics individually. Refusing has no effect on your ability to use the site or to enquire. To reset your choice, clear this site's stored data in your browser.</P>
    </LegalPage>
  );
}
