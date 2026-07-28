import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:8000'
  : 'כאן_תדביק_את_הכתובת_שקיבלת_מ-Render'; // החלף את הטקסט בכתובת האמיתית שקיבלת

export default axios.create({
  baseURL: API_BASE_URL,
});