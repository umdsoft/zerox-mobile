import axios from 'axios';

export const fetchUSDExchangeRate = async () => {
  try {
    const response = await axios.get(
      'https://cbu.uz/oz/arkhiv-kursov-valyut/json/',
    );
    return response.data[0].Rate;
  } catch (error) {
    console.error('Failed to fetch USD rate:', error);
    throw error;
  }
};
