"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDEBAR_WIDTH_EXPANDED = 244;
const TOGGLE_BUTTON_SIZE = 40;
const SIDEBAR_OFFSET = 16;
const CONTENT_GAP = 32;
const COLLAPSED_CONTENT_PADDING = SIDEBAR_OFFSET + TOGGLE_BUTTON_SIZE + 16;

type NavLeaf = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  children: NavLeaf[];
};

type NavItem = NavLeaf | NavGroup;

const isNavGroup = (item: NavItem): item is NavGroup => "children" in item;

const NAV_ITEMS: NavItem[] = [
  {
    label: "CYTOSCAPE",
    children: [
      { label: "CoSE", href: "/cytoscape/cose" },
      { label: "CoSE with Worker", href: "/cytoscape/cose-worker" },
      { label: "CoSE with WebGPU", href: "/cytoscape/cose-webgpu" },
      { label: "CoSE-Bilkent", href: "/cytoscape/cose-bilkent" },
      { label: "FCoSE", href: "/cytoscape/fcose" },
      { label: "FCoSE with Worker", href: "/cytoscape/fcose-worker" },
    ],
  },
  {
    label: "E-CHARTS",
    children: [{ label: "Ranking", href: "/e-charts/ranking" }],
  },
  {
    label: "ETC",
    children: [
      { label: "CoSE", href: "/etc/raw-cose" },
      { label: "Force-directed", href: "/etc/force-directed" },
    ],
  },
];

type SidebarLayoutProps = {
  children: ReactNode;
};

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showOpenButton, setShowOpenButton] = useState(false);

  const pathname = usePathname();
  const openButtonTimerRef = useRef<number | null>(null);

  const contentPaddingLeft = collapsed
    ? COLLAPSED_CONTENT_PADDING
    : SIDEBAR_WIDTH_EXPANDED + CONTENT_GAP;

  useEffect(() => {
    return () => {
      if (openButtonTimerRef.current !== null) {
        clearTimeout(openButtonTimerRef.current);
      }
    };
  }, []);

  const collapseSidebar = () => {
    setCollapsed(true);
    setShowOpenButton(false);
    if (openButtonTimerRef.current !== null) {
      clearTimeout(openButtonTimerRef.current);
    }
    openButtonTimerRef.current = window.setTimeout(() => {
      setShowOpenButton(true);
    }, 200);
  };

  const expandSidebar = () => {
    setCollapsed(false);
    setShowOpenButton(false);
    if (openButtonTimerRef.current !== null) {
      clearTimeout(openButtonTimerRef.current);
    }
  };

  return (
    <div className="min-h-screen">
      <aside
        className={`fixed bottom-4 left-4 top-4 z-40 flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-zinc-900 transition-[width,opacity,transform] duration-300 ${
          collapsed
            ? "pointer-events-none -translate-x-2 opacity-0"
            : "translate-x-0 opacity-100"
        }`}
        style={{ width: collapsed ? 0 : SIDEBAR_WIDTH_EXPANDED }}
        aria-hidden={collapsed}
      >
        {!collapsed && (
          <>
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-zinc-800/90 text-zinc-100 transition hover:border-cyan-400 hover:text-cyan-400 hover:bg-zinc-800"
              onClick={collapseSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>

            <nav className="mt-16 flex flex-1 flex-col gap-2 px-2">
              {NAV_ITEMS.map((item) => {
                if (isNavGroup(item)) {
                  if (item.children.length === 0) {
                    return null;
                  }

                  return (
                    <div key={item.label} className="flex flex-col gap-2">
                      <div className="px-4 py-2 text-sm font-semibold text-zinc-100 tracking-wider">
                        {item.label}
                      </div>
                      <div className="flex flex-col gap-2 pl-2">
                        {item.children.map((child) => {
                          const isActive = pathname === child.href;

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              aria-current={isActive ? "page" : undefined}
                              className={`rounded-2xl px-4 py-2.5 text-[12px] font-semibold transition ${
                                isActive
                                  ? "bg-cyan-200/15 text-cyan-300"
                                  : "text-white hover:bg-cyan-200/15 hover:text-cyan-300"
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              })}
            </nav>
          </>
        )}
      </aside>
      {showOpenButton && (
        <button
          type="button"
          className="fixed left-4 top-7 z-50 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-zinc-800/90 backdrop-blur-sm text-zinc-200 transition hover:border-cyan-400 hover:text-cyan-400 hover:bg-zinc-800"
          onClick={expandSidebar}
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}

      <main
        className="min-h-screen transition-[padding-left] duration-300"
        style={{ paddingLeft: contentPaddingLeft }}
      >
        {children}
      </main>
    </div>
  );
}
