export const formatPrice = (price: number | undefined | null) => {
  const numPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(numPrice);
};
