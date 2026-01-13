type PageIntroProps = {
  eyebrow: string;
  title?: string;
};

export const PageIntro = ({ eyebrow }: PageIntroProps) => {
  return (
    <header className="flex flex-col">
      <h2 className="text-2xl font-semibold text-gray-900">{eyebrow}</h2>
    </header>
  );
};
