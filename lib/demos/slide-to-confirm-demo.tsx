"use client";

import { SlideToConfirm } from "@/components/interior/slide-to-confirm";

export function SlideToConfirmDemo() {
  return (
    <div className="grid w-full place-items-center">
      <div className="w-full max-w-[320px]">
        <SlideToConfirm
          onConfirm={() => {}}
          label="Slide to send"
          confirmedLabel="Sent"
          resetAfter={2200}
        />
      </div>
    </div>
  );
}
