let a: string = 'QURAMBOYEV JAMSHID RASHIDOVICH';

function renderName(name: string) {
  if (name.includes('O‘G‘LI') || name.includes('O‘G‘LI')) {
    // 'O‘G‘LI' should be o‘g‘li---> QuramBoyev Jamshid Rashid o‘g‘li
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace('O‘g‘li', 'o‘g‘li');
  }
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

console.log(renderName(a), 'name');
