"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg text-warm-gray hover:text-charcoal hover:bg-cream-dark transition-colors" aria-label="Toggle theme">
        <Sun className="w-4.5 h-4.5" />
      </button>
    );
  }

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label = theme === "dark" ? "Dark mode" : theme === "light" ? "Light mode" : "System theme";

  return (
    <button
      onClick={cycle}
      className="p-2 rounded-lg text-warm-gray hover:text-charcoal hover:bg-cream-dark transition-colors"
      aria-label={label}
      title={label}
    >
      <Icon className="w-4.5 h-4.5" />
    </button>
  );
}
