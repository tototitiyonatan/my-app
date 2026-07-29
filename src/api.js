import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV ? '' : 'https://soroka-server.onrender.com',
});

export default api;