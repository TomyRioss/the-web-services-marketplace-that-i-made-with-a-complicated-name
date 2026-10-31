import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getProfileById } from "@/lib/profiles";
import { AppShell } from "@/app/AppShell";
import { MobileNavMenu } from "@/components/MobileNavMenu";
import { SiteCardNav } from "@/components/SiteCardNav";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";

export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session) {
    const profile = await getProfileById(session.userId);
    if (profile) {
      return (
        <AppShell profile={profile}>
          {children}
        </AppShell>
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div aria-hidden="true" className="h-[72px] shrink-0 bg-black md:h-24 md:bg-secondary/40" />
      <header className="fixed inset-x-0 top-0 z-50">
        <div>
          <div className="flex h-[72px] w-full items-center justify-between bg-secondary/40 px-3 md:hidden">
            <Link href="/marketplace" aria-label="Devta">
              <BrandLogo inverse size="large" />
            </Link>
            <MobileNavMenu />
          </div>
          <div className="mx-auto hidden max-w-7xl px-4 pt-4 md:block">
            <SiteCardNav />
          </div>
        </div>
      </header>

      {children}
      <SiteFooter />
    </div>
  );
}
