import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:3001/api',
});

export default api;
