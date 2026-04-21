import { useEffect, useRef } from "react";

interface AdSenseProps {
  slot?: string;
  format?: string;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdSense = ({
  slot = "1234567890",
  format = "auto",
  className = "",
  style,
}: AdSenseProps) => {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <ins
        className="adsbygoogle"
        style={style ?? { display: "block", minHeight: 90, width: "100%", maxWidth: 728 }}
        data-ad-client="ca-pub-7497926910496151"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSense;
