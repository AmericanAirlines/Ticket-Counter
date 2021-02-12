import express from 'express';
import health from './health';

const api = express.Router();

api.use(express.json());
api.use(express.urlencoded({ extended: false }));

api.use('/health', health);

export default api;
