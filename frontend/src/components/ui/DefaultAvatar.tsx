import * as React from "react";
import { cn } from "@/lib/utils";

interface DefaultAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
};

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ className, size = "md" }) => {
  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-gray-100 items-center justify-center text-gray-500",
        sizeClasses[size],
        className
      )}
    >
      <i className="fas fa-user" />
    </div>
  );
};

export { DefaultAvatar };
