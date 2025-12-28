import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PerformanceProvider } from "@/components/providers/PerformanceProvider";
import { ToastProvider } from "@/components/molecules/Toast";
import { OnboardingProvider } from "@/components/providers/OnboardingProvider";
import { EnvironmentProvider } from "@/components/providers/EnvironmentProvider";

// Use system fonts as fallback for deployment stability
const fontVariables = "--font-geist-sans --font-geist-mono";

export const metadata: Metadata = {
  title: "Arba Delivery - Delivery Platform",
  description: "Fast and reliable delivery service platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans antialiased`}
      >
        <EnvironmentProvider>
          <PerformanceProvider>
            <ThemeProvider>
              <ToastProvider>
                <OnboardingProvider>
                  <QueryProvider>
                    {children}
                  </QueryProvider>
                </OnboardingProvider>
              </ToastProvider>
            </ThemeProvider>
          </PerformanceProvider>
        </EnvironmentProvider>
      </body>
    </html>
  );
}
