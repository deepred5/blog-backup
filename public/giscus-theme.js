(() => {
  const GISCUS_ORIGIN = "https://giscus.app";
  const RETRY_DELAY = 200;
  const MAX_RETRIES = 20;

  const mapTheme = theme => (theme === "dark" ? "dark" : "light");

  const postThemeToGiscus = theme => {
    const frames = Array.from(
      document.querySelectorAll("iframe.giscus-frame")
    ).filter(frame => frame?.contentWindow);

    if (frames.length === 0) {
      return false;
    }

    for (const frame of frames) {
      frame.contentWindow?.postMessage(
        {
          giscus: {
            setConfig: {
              theme,
            },
          },
        },
        GISCUS_ORIGIN
      );
    }

    return true;
  };

  const ensureGiscusTheme = (retry = 0) => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") ?? "light";
    const normalizedTheme = mapTheme(currentTheme);

    if (postThemeToGiscus(normalizedTheme)) {
      return;
    }

    if (retry < MAX_RETRIES) {
      window.setTimeout(() => ensureGiscusTheme(retry + 1), RETRY_DELAY);
    }
  };

  const watchThemeChanges = () => {
    if (window.__giscusThemeObserver) {
      return;
    }

    window.__giscusThemeObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-theme"
        ) {
          ensureGiscusTheme();
        }
      }
    });

    window.__giscusThemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  };

  if (!window.__giscusThemeListener) {
    document.addEventListener("astro:page-load", () => {
      ensureGiscusTheme();
      window.setTimeout(() => ensureGiscusTheme(), 300);
    });
    window.__giscusThemeListener = true;
  }

  watchThemeChanges();
  ensureGiscusTheme();
})();

