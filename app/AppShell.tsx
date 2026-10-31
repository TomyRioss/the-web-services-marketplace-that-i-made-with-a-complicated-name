import Link from "next/link";
import { MobileNavMenu } from "@/components/MobileNavMenu";
import { SiteCardNav } from "@/components/SiteCardNav";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";

export function AppShell({
  profile,
  children,
}: {
  profile: { email: string; role: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div aria-hidden="true" className="h-[72px] shrink-0 bg-black md:h-24 md:bg-secondary/40" />
      <header className="fixed inset-x-0 top-0 z-50">
        <div>
          <div className="flex h-[72px] w-full items-center justify-between bg-secondary/40 px-3 md:hidden">
            <Link href="/marketplace" aria-label="Devta">
              <BrandLogo inverse size="large" />
            </Link>
            <MobileNavMenu role={profile.role} />
          </div>
          <div className="mx-auto hidden max-w-7xl px-4 pt-4 md:block">
            <SiteCardNav role={profile.role} />
          </div>
        </div>
      </header>
      {children}
      <SiteFooter />
    </div>
  );
}
