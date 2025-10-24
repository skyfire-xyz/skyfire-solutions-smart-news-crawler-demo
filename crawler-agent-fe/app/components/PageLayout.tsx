// app/components/PageLayout.tsx
interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pl-36 pt-6">
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl">
          {children}
        </div>
      </div>
    </div>
  );
}