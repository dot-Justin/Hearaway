import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AudioProvider } from "@/components/AudioProvider";
// import ThemeToggle from "@/components/ThemeToggle";

const THEME_STORAGE_KEY = "hearaway-theme";

const themeInitializer = `
(function() {
  const storageKey = '${THEME_STORAGE_KEY}';
  const classNameDark = 'dark';

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  try {
    let theme = null;

    try {
      theme = window.localStorage.getItem(storageKey);
    } catch (error) {
      theme = null;
    }

    if (!theme) {
      theme = getCookie(storageKey);
    }

    if (!theme) {
      // Default to dark theme
      theme = 'dark';
    }

    if (theme === 'dark') {
      document.documentElement.classList.add(classNameDark);
    } else {
      document.documentElement.classList.remove(classNameDark);
    }

    document.documentElement.dataset.theme = theme;
  } catch (error) {
    // Ignore theme initialization errors; server-rendered class remains.
  }
})();
`;

const gambarino = localFont({
  src: "../public/fonts/Gambarino-Regular.woff2",
  variable: "--font-gambarino",
  weight: "400",
});

const articulat = localFont({
  src: [
    {
      path: "../public/fonts/Articulat_CF_Thin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/Articulat_CF_Extra_Light.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/Articulat_CF_Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/Articulat_CF_Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Articulat_CF_Normal.otf",
      weight: "450",
      style: "normal",
    },
    {
      path: "../public/fonts/Articulat_CF_Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Articulat_CF_Demi_Bold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Articulat_CF_Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Articulat_CF_Extra_Bold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/Articulat_CF_Heavy.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-articulat",
});

export const metadata: Metadata = {
  title: "Hearaway",
  description: "The world, in sound.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("hearaway-theme")?.value;
  const initialTheme = themeCookie === "light" ? "light" : "dark";
  const htmlClassName = initialTheme === "dark" ? "dark" : "";

  return (
    <html
      lang="en"
      className={htmlClassName}
      data-theme={initialTheme}
      suppressHydrationWarning
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitializer }}
        />
      </head>
      <body className={`${gambarino.variable} ${articulat.variable} antialiased`}>
        <ThemeProvider initialTheme={initialTheme}>
          <AudioProvider>
            {/* <ThemeToggle /> */}
            {children}
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
