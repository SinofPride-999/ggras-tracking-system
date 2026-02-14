"use client";

import { usePathname } from "next/navigation";
import { portals } from "@/lib/constants/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

function getCurrentPortal(pathname: string) {
  if (pathname.startsWith("/overseer")) {
    return "admin";
  }
  if (pathname.startsWith("/my-milestones")) {
    return "developer";
  }
  return "admin";
}

export function PortalSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const current = getCurrentPortal(pathname);

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        const portal = portals.find(
          (_, i) => ["admin", "developer"][i] === value
        );
        if (portal) router.push(portal.href);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin Portal</SelectItem>
        <SelectItem value="developer">Developer Portal</SelectItem>
      </SelectContent>
    </Select>
  );
}
