import { useState } from 'react';
import { Tabs } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Divider } from '../ui/Divider';

export interface Tier {
  tab: string;
  eyebrow: string;
  hotel: string;
  lead: string;
  points: string[];
  img: { src: string; srcset?: string; width: number; height: number };
}

export interface JourneyTiersProps {
  tiers: Tier[];
}

/** Standard / Signature switch on /journey. */
export function JourneyTiers({ tiers }: JourneyTiersProps) {
  const [tier, setTier] = useState(0);
  const base = 'tier';
  return (
    <>
      <Tabs tabs={tiers.map((t) => t.tab)} active={tier} onChange={setTier} idBase={base} label="Hotel tier"
        style={{ justifyContent: 'center', marginBottom: 36 }} />
      {tiers.map((t, i) => (
        <div key={t.tab} role="tabpanel" id={`${base}-panel-${i}`} aria-labelledby={`${base}-tab-${i}`} hidden={i !== tier}
          className="tier-panel">
          <img className="tier-panel__img" src={t.img.src} srcSet={t.img.srcset} width={t.img.width} height={t.img.height}
            alt={t.hotel} loading="lazy" decoding="async" />
          <div className="tier-panel__body">
            <div className="label">{t.eyebrow}</div>
            <h3 className="tier-panel__hotel">{t.hotel}</h3>
            <p className="tier-panel__lead">{t.lead}</p>
            <ul className="tier-panel__points">
              {t.points.map((p) => (
                <li key={p}><span className="diamond tier-panel__dot" aria-hidden="true" />{p}</li>
              ))}
            </ul>
            <Divider tone="hairline" style={{ margin: '0 0 18px' }} />
            <div className="label label--12">Priced on request</div>
            <p className="tier-panel__note">Every journey is bespoke; your exact price is confirmed on the consultation call. Flights are not included — though we are glad to arrange business- or first-class travel as an add-on.</p>
            <Button href="/enquire">Enquire about this tier</Button>
          </div>
        </div>
      ))}
    </>
  );
}
