import { ReactNode } from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import CommandPalette from "../ui/commandPalettes/CommandPalette";
import NewSidebarLayout from "../layouts/NewSidebarLayout";
import { useSearchParams } from "@remix-run/react";

interface Props {
  layout: "app" | "admin" | "docs";
  children: ReactNode;
  type?: "new" | "old";
}

export default function AppLayout({ layout, children, type = "new" }: Props) {
  const [searchParams] = useSearchParams();
  const sidebarParam = searchParams.get("sidebar");
  if (sidebarParam === "new") {
    type = "new";
  } else if (sidebarParam === "old") {
    type = "old";
  }
  return (
    <div>
      <CommandPalette key={layout} layout={layout}>
        {type === "new" ? <NewSidebarLayout layout={layout}>{children}</NewSidebarLayout> : <SidebarLayout layout={layout}>{children}</SidebarLayout>}
      </CommandPalette>
      {/* {layout === "app" ? (
        <AppCommandPalette isOpen={showCommandPalette} onClosed={() => setShowCommandPalette(false)} />
      ) : layout === "admin" ? (
        <AdminCommandPalette isOpen={showCommandPalette} onClosed={() => setShowCommandPalette(false)} />
      ) : layout === "docs" && commands ? (
        <CommandPalette isOpen={showCommandPalette} onClosed={() => setShowCommandPalette(false)} commands={commands} />
      ) : (
        <div></div>
      )} */}
    </div>
  );
}
