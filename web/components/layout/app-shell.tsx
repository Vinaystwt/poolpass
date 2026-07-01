import { Nav } from "./nav";
import { Footer } from "./footer";
import { Walkthrough } from "@/components/walkthrough";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
      <Walkthrough />
    </div>
  );
}
