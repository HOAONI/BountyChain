import axios from 'axios';


const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default {
    getTasks() {
        return apiClient.get('/tasks');
    },
    postTask(taskData) {
        return apiClient.post('/tasks', taskData);
    },

};