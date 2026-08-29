import PageMeta from '@/components/common/PageMeta';

export default function WorkInProgressPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-16 text-foreground">
      <section className="w-full max-w-3xl rounded-3xl border border-primary/20 bg-card/70 p-8 text-center shadow-2xl backdrop-blur-xl md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Vishvakarma.OS</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">Work in progress</h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Vishvakarma.OS is being rebuilt on a cleaner Cloudflare-native foundation. The current production experience is temporarily paused while vNext is hardened, tested, and prepared for release.
        </p>
        <div className="mt-8 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          vNext rebuild underway
        </div>
        <p className="mt-8 text-sm text-muted-foreground">Existing project data and backend services are being preserved during the rebuild.</p>
      </section>
      <PageMeta
        title="Vishvakarma.OS — Work in progress"
        description="Vishvakarma.OS is currently being rebuilt and hardened for its next production release."
      />
    </main>
  );
}
