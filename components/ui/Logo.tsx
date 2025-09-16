// components/ui/Logo.tsx
import Image from "next/image";
import logo from "@/public/images/logo.png";

type LogoProps = {
  width?: number;        // render width in px
  className?: string;    // optional wrapper class
  imgClassName?: string; // optional <Image> class
  unwrapped?: boolean;   // if true, render <Image> directly
};

export default function Logo({
  width = 200,
  className = "",
  imgClassName,
  unwrapped = false,
}: LogoProps) {
  const height = Math.round((width / (logo as any).width) * (logo as any).height);
  const img = (
    <Image
      src={logo}
      alt="Smart Semester Planner Logo"
      priority
      width={width}
      height={height}
      className={imgClassName}
    />
  );
  if (unwrapped) return img;
  const wrapperClass = ["inline-block", className].filter(Boolean).join(" ");
  return <div className={wrapperClass}>{img}</div>;
}
