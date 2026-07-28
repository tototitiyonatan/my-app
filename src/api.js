import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:8000'
  : 'https://soroka-server.onrender.com'; // החלף את הטקסט בכתובת האמיתית שקיבלת

export default axios.create({
  baseURL: API_BASE_URL,
});