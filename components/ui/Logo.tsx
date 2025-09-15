// components/ui/Logo.tsx
import Image from "next/image";

type LogoProps = {
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
};

export default function Logo({ size = 32, showText = true, showTagline = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <Image src="/images/logo.png" alt="CourseFlow Logo" width={size} height={size} />
      {showText && (
        <div className="flex flex-col leading-snug">
          <span className="text-xl font-bold">CourseFlow</span>
          {showTagline && (
            <div className="flex flex-col text-slate-300 text-xs">
              <span>Own your education.</span>
              <span className="font-medium">Find your Flow.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
