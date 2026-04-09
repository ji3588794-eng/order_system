import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="adminContainer">
      <aside className="sidebar">
      </aside>
      <main className="content">
        {children}
      </main>
    </div>
  );
}