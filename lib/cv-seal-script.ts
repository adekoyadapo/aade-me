/**
 * Inline script, first child of #cv-root on /cv. Runs before the CV paints: when JS is on, motion is allowed and the CV has not
 * been decoded or skipped this session, it sets data-cv="sealed" on its parent. Anything else leaves the CV visible. The same
 * decision is repeated in components/cv-reveal.tsx for client-side navigation (inline scripts do not run there).
 */
export const CV_SEEN_KEY = "cv-decoded";
export const cvSealScript = `(function(){try{var r=document.currentScript.parentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(sessionStorage.getItem("${CV_SEEN_KEY}"))return;r.setAttribute("data-cv","sealed")}catch(e){}})()`;
