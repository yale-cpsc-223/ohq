import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { toTemporalInstant } from "temporal-polyfill";

Object.defineProperty(Date.prototype, "toTemporalInstant", {
  value: toTemporalInstant,
  writable: true,
  configurable: true,
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>,
  );
});
