import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Settings, ChevronDown, Check, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./navItems";
import BrandCrest from "./BrandCrest";
import { getVoice } from "@/lib/representation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LeftRail({ cases = [], activeCase, onSelectCase }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const label = activeCase?.title || "Demo Case: Disputed Visitation";

  return (
    <aside className="hidden w-64 flex-none flex-col border-r border-[#E6C2BF]/20 bg-[#3A2C29]/62 px-4 py-5 backdrop-blur-2xl lg:flex">
      <div className="flex items-center gap-3 px-1">
        <BrandCrest size={40} />
        <div className="min-w-0">
          <p className="font-display text-[12px] uppercase leading-tight tracking-[0.2em] text-[#E8CFC8]">
            We The Parent
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#8C7A73]">
            Case Operating System
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="eyebrow mb-2 px-1">Active case</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="reactive-card flex w-full items-center justify-between gap-2 rounded-xl border border-[#E6C2BF]/30 bg-[#1A1515]/60 px-3 py-2.5 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-[#F9EBE5]">{label}</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-[#8C7A73]">
                  {activeCase?.case_number || "24-DEP-01873"}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[#C99A92]" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 border-[#E6C2BF]/25 bg-[#1A1515] text-[#F8F0EE]">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-[#8C7A73]">
              Case workspaces
            </DropdownMenuLabel>
            {cases.length === 0 && (
              <DropdownMenuItem className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate">{label}</span>
                <Check className="h-3.5 w-3.5 text-[#D4B483]" strokeWidth={1.5} />
              </DropdownMenuItem>
            )}
            {cases.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => onSelectCase?.(item)}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="truncate">{item.title}</span>
                {activeCase?.id === item.id && (
                  <Check className="h-3.5 w-3.5 text-[#D4B483]" strokeWidth={1.5} />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-[#E6C2BF]/15" />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="text-[13px] text-[#DDD0D3]">
                Manage case workspaces
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all duration-300",
                active
                  ? "border border-[#E6C2BF]/55 bg-[#7A4E4A]/28 text-[#F9EBE5] shadow-[0_0_20px_rgba(230,194,191,0.18)]"
                  : "border border-transparent text-[#DDD0D3] hover:border-[#E6C2BF]/25 hover:bg-[#1A1515]/50 hover:text-[#F9EBE5]"
              )}
            >
              <Icon
                className={cn("h-[18px] w-[18px]", active ? "text-[#F9EBE5]" : "text-[#C99A92]")}
                strokeWidth={1.5}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-1 border-t border-[#E6C2BF]/15 pt-4">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors duration-300",
            pathname === "/"
              ? "bg-[#1A1515]/60 text-[#F9EBE5]"
              : "text-[#C99A92] hover:bg-[#1A1515]/50 hover:text-[#F9EBE5]"
          )}
        >
          <Compass className="h-4 w-4" strokeWidth={1.5} />
          Overview / Start Here
        </Link>
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#C99A92] transition-colors duration-300 hover:bg-[#1A1515]/50 hover:text-[#F9EBE5]"
        >
          <Settings className="h-4 w-4" strokeWidth={1.5} />
          Settings
        </Link>
        <div className="mt-3 rounded-xl border border-[#E6C2BF]/20 bg-[#1A1515]/45 p-3">
          <div className="flex items-center gap-2 text-[#D4B483]">
            <ShieldQuestion className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Guardrail</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#B7A6A3]">
            {getVoice({ representation: activeCase?.representation }).guardrail}
          </p>
        </div>
      </div>
    </aside>
  );
}