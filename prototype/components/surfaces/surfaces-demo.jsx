function SurfacesDemo() {
  const [tab, setTab] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Tabs tabs={['Itinerary', 'Courses', 'Accommodation']} active={tab} onChange={setTab} />
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <Card style={{ width: 240 }} image="../../assets/img-destination.png" badge="Signature"
          eyebrow="Lake Como" title="Villa d'Este & Menaggio"
          footer={<React.Fragment><span>7 nights</span><span>From $14,800</span></React.Fragment>}>
          Three storied courses and a chef at your table.
        </Card>
        <Card style={{ width: 240 }} eyebrow="Enquiry" title="Speak with an Atelier">
          Every journey begins with a conversation.
          <div style={{ marginTop: 14 }}><Button size="sm" onClick={() => setOpen(true)}>Open Dialog</Button></div>
        </Card>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} eyebrow="Enquiry" title="Begin Your Journey"
        actions={<Button onClick={() => setOpen(false)}>Send Enquiry</Button>}>
        Tell us where you dream of playing, and an atelier will reply within one business day.
      </Dialog>
    </div>
  );
}
