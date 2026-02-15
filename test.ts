// let a: string = 'QURAMBOYEV JAMSHID RASHIDOVICH';

import axios from 'axios';

// function renderName(name: string) {
//   if (name.includes('O‘G‘LI') || name.includes('O‘G‘LI')) {
//     // 'O‘G‘LI' should be o‘g‘li---> QuramBoyev Jamshid Rashid o‘g‘li
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ')
//       .replace('O‘g‘li', 'o‘g‘li');
//   }
//   return name
//     .split(' ')
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//     .join(' ');
// }

// console.log(renderName(a), 'name');

// const date = '2026-10-10';

// const minimumDate = date => {
//   let today = new Date(date);
//   if (today < new Date()) {
//     today = new Date();
//   }
//   return today.getTime() + 86400000;
// };

// console.log(new Date(minimumDate(date)), 'minimumDate');

async function fetchData() {
  try {
    const response = await axios.post(
      'https://app.zerox.uz/api/v1/user/myid/session',
      {},
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjM0NTYsImlhdCI6MTY5ODU2NzI4MH0.W5bXo5YkYV6pX3Z2KzFhYzVhZTBiNjYzZjJlY2E2YzQ`,
          'Content-Type': 'application/json',
          Connection: 'close',
        },
      },
    );
    const data = response.data;
    console.log(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchData();
