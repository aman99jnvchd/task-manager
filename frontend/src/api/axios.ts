// src/api/axio.tsx
import axios from 'axios';
import type { Task } from '../types/task';

const BASE_URL = 'http://127.0.0.1:8000/api/';

const API = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/* Automatically add token to all requests */
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export const getToken = async ({ username, password }: { username: string; password: string }) => {
    const response = await API.post('login/', { username, password });
    return response.data.token;
};

export const getUsersList = async () => {
    const response = await API.get('users/');
    return response.data;
};

export const getAdminsList = async () => {
    const response = await API.get('admins/');
    return response.data;
};

export const getTasksList = async (finalQuery: string) => {
    const response = await API.get(`tasks/?${finalQuery}`);
    return response.data;
};

export const createTask = async (taskData: Partial<Task>) => {
    const response = await API.post('tasks/', taskData);
    return response.data;
};

export const updateTask = async (id: number, updatedData: Partial<Task>) => {
    const response = await API.patch(`tasks/${id}/`, updatedData);
    return response.data;
};

export const deleteTask = async (id: number) => {
    await API.delete(`tasks/${id}/`);
};

export const loggedInUser = async () => {
    const response = await API.get('me/');
    return response.data;
};
