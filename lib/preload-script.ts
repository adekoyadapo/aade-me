/**
 * Inline <head> script for the preloader (components/preloader.tsx). Runs after the theme script, before first paint.
 * Decides once per browser session, on the first document load only, whether the preloader plays: home route, motion allowed,
 * not a crawler, sessionStorage usable and not yet set. It then sets data-preload on <html>, which the critical CSS turns into a
 * full-screen cover. Without JS the attribute never exists, so the cover never shows. A hard timeout removes the cover and the
 * inert page whatever else happens (6 s), so nobody can get stuck behind it.
 */
export const preloadInitScript = `(function(){try{var d=document.documentElement,k="pl";if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1");if(location.pathname!=="/"||matchMedia("(prefers-reduced-motion: reduce)").matches||/bot|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|preview/i.test(navigator.userAgent))return;d.setAttribute("data-preload","");setTimeout(function(){if(!d.hasAttribute("data-preload"))return;d.removeAttribute("data-preload");d.removeAttribute("data-pl-exit");var s=document.getElementById("shell");if(s)s.removeAttribute("inert")},6000)}catch(e){}})()`;

/** Critical CSS, inlined in <head> so the cover exists from the first paint. The full styling is in app/globals.css ("Preloader"). */
export const preloadCriticalCss =
  ".pl,.pl-status{display:none}html[data-preload]{overflow:hidden;scrollbar-gutter:stable}html[data-preload] .pl{display:block;position:fixed;inset:0;z-index:4000;background:var(--bg,#1f1f1f)}html[data-preload] .pl-status{display:block}";

/** Runs at the end of <body>, as soon as the page shell is parsed: the page is inert (unfocusable, not clickable) while the cover shows. */
export const preloadInertScript = `(function(){var s=document.getElementById("shell");if(s&&document.documentElement.hasAttribute("data-preload"))s.setAttribute("inert","")})()`;
