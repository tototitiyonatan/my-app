import axios from 'axios';

const api = axios.create({
  baseURL: 'https://soroka-server.onrender.com',
});

export default api;