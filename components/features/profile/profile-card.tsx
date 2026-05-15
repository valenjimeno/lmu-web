export function ProfileCard() {
  return (
    <section className="app-shell-card rounded-[2rem] p-6">
      <p className="section-kicker text-xs font-semibold">Perfil</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Cockpit personal</h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
        Aquí iremos conectando preferencias, identidad del piloto y ajustes personales para que la
        experiencia web conserve la misma coherencia premium que la app iOS.
      </p>
    </section>
  );
}
