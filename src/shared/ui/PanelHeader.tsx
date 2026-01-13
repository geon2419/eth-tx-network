type PanelHeaderProps = {
  children: React.ReactNode;
};

export function PanelHeader({ children }: PanelHeaderProps) {
  return <p className="text-md font-semibold text-gray-900">{children}</p>;
}
