import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "./components/nav";
import { TasksProvider } from "@/lib/tasks-context";
import { ToastProvider } from "@/lib/toast-context";
import { getTasks, getTrashedTasks } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestionnaire de tâches",
  description: "Application de gestion de tâches — todo, priorités et statuts.",
};

// Pose la classe .dark avant le premier rendu pour éviter tout flash de thème.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var e=document.documentElement;e.classList.toggle('dark',d);e.classList.add('theme-ready');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tasks, trashedTasks] = await Promise.all([
    getTasks(),
    getTrashedTasks(),
  ]);

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-page text-content">
        <ToastProvider>
          <TasksProvider initialTasks={tasks} initialTrashedTasks={trashedTasks}>
            <Nav />
            {children}
          </TasksProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
