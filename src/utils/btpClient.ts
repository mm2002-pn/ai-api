import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

export const createBtpClient = (accessToken: string): AxiosInstance => {
  return axios.create({
    baseURL: env.btpApiUrl,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });
};
