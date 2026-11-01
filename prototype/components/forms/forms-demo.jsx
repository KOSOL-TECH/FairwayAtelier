function FormsDemo() {
  const [c, setC] = React.useState(true);
  const [r, setR] = React.useState(0);
  const [s, setS] = React.useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="Full Name" placeholder="As it appears on your passport" />
        <Select label="Destination" options={['Lake Como, Italy', 'St Andrews, Scotland', 'The Algarve, Portugal']} />
      </div>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        <Checkbox label="Include caddie service" checked={c} onChange={setC} />
        <Checkbox label="Unchecked" checked={false} onChange={() => {}} />
        <Radio label="Twin room" checked={r === 0} onChange={() => setR(0)} />
        <Radio label="Suite" checked={r === 1} onChange={() => setR(1)} />
        <Switch label="Travel updates" checked={s} onChange={setS} />
      </div>
    </div>
  );
}
