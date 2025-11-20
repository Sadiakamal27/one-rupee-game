"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function GoogleButton({
  onClick,
  loading = false,
  text = "Sign in with Google",
}: {
  onClick: () => void;
  loading?: boolean;
  text?: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      variant="outline"
      className="w-full flex items-center cursor-pointer  justify-center gap-3 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    >
      <Image
        src="/google.webp"
        alt="Google Logo"
        width={40}
        height={40}
      />
      <span>{loading ? "Please wait..." : text}</span>
    </Button>
  );
}
