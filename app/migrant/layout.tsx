export const metadata = {
  title: "МигрантРА — Личный кабинет",
};

export default function MigrantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden min-h-[700px] flex flex-col">
        {children}
      </div>
    </div>
  );
}
