export const checkingDate = text => {
  let x = text.replaceAll('.', '-');
  const date = new Date(x);
  return date.getTime();
};
