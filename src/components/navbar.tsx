"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Car, Menu, X, ChevronDown, User, LogOut, LayoutDashboard, PlusCircle } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-lg group-hover:shadow-blue-500/25 transition-shadow">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">
              Auto<span className="text-gradient">Market</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              href="/cars"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Browse Cars
            </Link>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-8 w-24 skeleton rounded-lg" />
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-brand text-white text-xs font-bold">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="max-w-[120px] truncate">{session.user.name}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card shadow-lg shadow-black/5 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs text-muted-foreground">Signed in as</p>
                      <p className="text-sm font-medium truncate">{session.user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/listings/new"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                        Post a Car
                      </Link>
                    </div>
                    <div className="p-1 border-t border-border">
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-semibold text-white gradient-brand rounded-lg shadow-md hover:shadow-blue-500/25 hover:opacity-90 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 space-y-1">
            <Link href="/" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/cars" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>Browse Cars</Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link href="/dashboard/listings/new" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>Post a Car</Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>Sign in</Link>
                <Link href="/auth/signup" className="block px-3 py-2 rounded-lg text-sm font-semibold text-white gradient-brand" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
