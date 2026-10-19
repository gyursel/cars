import { useEffect, useRef, useState } from "react";

export default function useShowroomNavigation(screen, lot) {
  const [activeNav, setActiveNav] = useState("home");
  const navigationTarget = useRef(null);
  const navigationFrame = useRef(null);

  useEffect(() => {
    if (screen !== "lot") return;
    let frame;
    function synchronize() {
      frame = null;
      const pending = navigationTarget.current;
      if (pending) {
        const element = document.getElementById(pending);
        const padding =
          parseFloat(
            getComputedStyle(document.documentElement).scrollPaddingTop,
          ) || 0;
        const desired =
          pending === "home"
            ? 0
            : element
              ? Math.max(
                  0,
                  Math.min(
                    window.scrollY +
                      element.getBoundingClientRect().top -
                      padding,
                    document.documentElement.scrollHeight - window.innerHeight,
                  ),
                )
              : null;
        if (desired !== null && Math.abs(window.scrollY - desired) < 3)
          navigationTarget.current = null;
        return;
      }
      const contact = document.getElementById("contact");
      const inventory = document.getElementById("inventory");
      if (!contact || !inventory) return;
      const atContact =
        contact.getBoundingClientRect().top < window.innerHeight * 0.55;
      const inInventory =
        inventory.getBoundingClientRect().top <= window.innerHeight * 0.55 &&
        inventory.getBoundingClientRect().bottom > 75;
      setActiveNav((previous) =>
        atContact
          ? "contact"
          : inInventory && ["search", "saved"].includes(previous)
            ? previous
            : "home",
      );
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(synchronize);
    }
    function interrupt(event) {
      if (
        event.type === "keydown" &&
        ![
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        return;
      navigationTarget.current = null;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchmove", interrupt, { passive: true });
    window.addEventListener("keydown", interrupt);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(navigationFrame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchmove", interrupt);
      window.removeEventListener("keydown", interrupt);
    };
  }, [screen, lot]);

  function handleNavigate(item) {
    navigationTarget.current = item.target || "home";
    setActiveNav(item.key);
    cancelAnimationFrame(navigationFrame.current);
    navigationFrame.current = requestAnimationFrame(() => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? "instant"
        : "smooth";
      if (!item.target) window.scrollTo({ top: 0, behavior });
      else
        document
          .getElementById(item.target)
          ?.scrollIntoView({ behavior, block: "start" });
    });
  }

  return [activeNav, handleNavigate];
}
