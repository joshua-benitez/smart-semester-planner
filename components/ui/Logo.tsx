// components/ui/Logo.tsx
import Image from "next/image";

type LogoProps = {
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
};

export default function Logo({
  size = 32,
  showText = true,
  showTagline = false,
}: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/images/logo.png"
        alt="CourseFlow Logo"
        width={size}
        height={size}
        priority
      />
      {showText && (
        <div className="leading-tight">
          <span className="text-xl font-bold">CourseFlow</span>
          {showTagline && (
            <p className="text-xs text-slate-300">
              Own your education. <span className="font-medium">Find your Flow.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
