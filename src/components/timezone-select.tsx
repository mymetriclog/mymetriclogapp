"use client";

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const POPULAR_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Asia/Karachi", // Pakistan timezone (UTC+5)
  "Asia/Kolkata", // India timezone (UTC+5:30)
  "Asia/Dubai", // UAE timezone (UTC+4)
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai", // China timezone (UTC+8)
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function TimezoneSelect({
  value = "UTC",
  onChange = () => {},
}: {
  value?: string;
  onChange?: (tz: string) => void;
}) {
  const id = useId();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select timezone" />
      </SelectTrigger>
      <SelectContent>
        {POPULAR_TIMEZONES.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {tz === "Asia/Karachi"
              ? "Asia/Karachi (Pakistan - UTC+5)"
              : tz === "Asia/Kolkata"
              ? "Asia/Kolkata (India - UTC+5:30)"
              : tz === "Asia/Dubai"
              ? "Asia/Dubai (UAE - UTC+4)"
              : tz === "Asia/Shanghai"
              ? "Asia/Shanghai (China - UTC+8)"
              : tz}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
