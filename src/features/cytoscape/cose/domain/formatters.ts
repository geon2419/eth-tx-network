export const formatAddress = (address: string) =>
  address.length <= 12
    ? address
    : `${address.slice(0, 6)}...${address.slice(-4)}`;
