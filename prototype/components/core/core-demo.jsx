function CoreDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="primary">Begin Your Journey</Button>
        <Button variant="secondary">View Itinerary</Button>
        <Button variant="ghost">Learn more</Button>
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Badge tone="brass">Signature</Badge><Badge tone="green">New for 2026</Badge>
        <Badge tone="stone">Waitlist</Badge><Badge tone="inverse">Sold Out</Badge>
      </div>
      <Eyebrow rules tone="brass">Bespoke Luxury Golf Travel</Eyebrow>
      <Divider ornament tone="brass" />
    </div>
  );
}
