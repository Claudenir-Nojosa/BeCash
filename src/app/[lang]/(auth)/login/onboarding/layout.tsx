// app/[lang]/(onboarding)/layout.tsx
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen w-full">
      {children}
    </section>
  );
}