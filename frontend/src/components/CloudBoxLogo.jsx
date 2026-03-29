/**
 * CloudBoxLogo — reusable SVG logo component
 *
 * Props:
 *   size     — icon size in px (default 32)
 *   variant  — "color" | "white" | "dark"  (default "color")
 *   showText — show "CloudBox" wordmark beside icon (default true)
 *   textSize — font-size for wordmark in px (default 20)
 *   className — extra class on the wrapper
 */
export default function CloudBoxLogo({
  size = 32,
  variant = "color",
  showText = true,
  textSize = 20,
  className = "",
}) {
  const isDark  = variant === "dark";
  const isWhite = variant === "white";

  /* icon colours */
  const boxFill    = isWhite ? "rgba(255,255,255,0.15)" : isDark ? "#1e3a5f" : "url(#cb-grad)";
  const cloudFill  = isWhite ? "#ffffff"                : isDark ? "#ffffff" : "url(#cb-cloud-grad)";
  const arrowColor = isWhite ? "#ffffff"                : isDark ? "#60a5fa" : "#ffffff";
  const textColor  = isWhite ? "#ffffff"                : isDark ? "#0f172a" : "#1e3a5f";
  const accentColor= isWhite ? "rgba(255,255,255,0.6)"  : isDark ? "#2563eb" : "#2563eb";

  return (
    <span
      className={`cb-logo-wrap ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: textSize * 0.45, textDecoration: "none" }}
    >
      {/* ── SVG ICON ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        <defs>
          {/* box background gradient */}
          <linearGradient id="cb-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          {/* cloud gradient */}
          <linearGradient id="cb-cloud-grad" x1="6" y1="10" x2="34" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="1" />
          </linearGradient>
          {/* glow filter */}
          <filter id="cb-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* rounded square background */}
        <rect width="40" height="40" rx="10" fill={boxFill} />

        {/* subtle inner highlight */}
        {!isWhite && (
          <rect x="1" y="1" width="38" height="19" rx="10" fill="white" fillOpacity="0.07" />
        )}

        {/* cloud shape */}
        <path
          d="M28.5 23.5a5 5 0 00-4.4-6.9h-.6a7.5 7.5 0 10-7.5 8.4h12.5z"
          fill={cloudFill}
          filter="url(#cb-glow)"
        />

        {/* upload arrow */}
        <path
          d="M20 27v-5M17.5 24.5L20 22l2.5 2.5"
          stroke={arrowColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* ── WORDMARK ── */}
      {showText && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 800,
            fontFamily: "'Inter', 'Manrope', sans-serif",
            letterSpacing: "-0.6px",
            lineHeight: 1,
            color: textColor,
            userSelect: "none",
          }}
        >
          Cloud
          <span style={{ color: accentColor }}>Box</span>
        </span>
      )}
    </span>
  );
}
