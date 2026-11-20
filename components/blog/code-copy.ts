/** Adds a Copy button to each code block in the post. Returns an undo function. Loaded lazily by post-islands. */
export default function addCodeCopy(): () => void {
  const undo: (() => void)[] = [];
    document.querySelectorAll<HTMLPreElement>("#post-content pre").forEach((pre) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.className = "code-copy";
      let t: number | undefined;
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText((pre.querySelector("code")?.textContent ?? "").replace(/\n$/, ""));
          btn.textContent = "Copied";
        } catch {
          btn.textContent = "Failed";
        }
        window.clearTimeout(t);
        t = window.setTimeout(() => (btn.textContent = "Copy"), 2000);
      });
      const wrap = document.createElement("div");
      wrap.className = "code-wrap";
      pre.parentNode?.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      wrap.appendChild(btn);
      const hadTab = pre.hasAttribute("tabindex");
      if (!hadTab) pre.tabIndex = 0;
      undo.push(() => {
        btn.remove();
        if (!hadTab) pre.removeAttribute("tabindex");
        wrap.parentNode?.insertBefore(pre, wrap);
        wrap.remove();
      });
    });
  return () => undo.forEach((f) => f());
}
