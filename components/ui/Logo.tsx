// components/ui/Logo.tsx
import Image from "next/image";

type LogoProps = {
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  brandClass?: string;
  taglineClass?: string;
};

export default function Logo({ size = 32, showText = true, showTagline = false, className = "", brandClass, taglineClass }: LogoProps) {
  const brandTextClass = brandClass ?? (size >= 72 ? "text-4xl" : size >= 56 ? "text-2xl" : "text-xl");
  const taglineTextClass = taglineClass ?? (size >= 72 ? "text-base" : size >= 56 ? "text-sm" : "text-xs");

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Image src="/images/logo.png" alt="CourseFlow Logo" width={size} height={size} priority />
      {showText && (
        <div className="leading-snug">
          <div className={`${brandTextClass} font-bold`}>CourseFlow</div>
          {showTagline && (
            <div className="mt-1">
              <div className={`text-slate-300 ${taglineTextClass}`}>Own your education.</div>
              <div className={`text-slate-300 ${taglineTextClass} font-medium`}>Find your Flow.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
