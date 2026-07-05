import { HybridNavProvider } from "@/components/hybrid/HybridNavProvider";
import { HybridHero } from "@/components/HybridHero";
import { ScrollSections } from "@/components/sections/ScrollSections";

/**
 * Integration example.
 * <HybridNavProvider> wraps the whole page so gaze/gesture targets work in
 * every section, not just the hero.
 */
export default function Home() {
  return (
    <HybridNavProvider>
      <main>
        <HybridHero />
        <ScrollSections />
      </main>
    </HybridNavProvider>
  );
}
