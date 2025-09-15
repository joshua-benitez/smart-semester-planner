// components/ui/Logo.tsx
import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

// The logo asset now includes the wordmark and tagline.
// Render the image only; no additional text.
export default function Logo({ size = 400, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image src="/images/logo.png" alt="CourseFlow Logo" width={size} height={size} priority />
    </div>
  )
}
