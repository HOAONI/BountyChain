import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
    const userAddress = ref(sessionStorage.getItem('userAddress') || null);
    const isLoggedIn = ref(!!sessionStorage.getItem('userAddress'));


    const login = (address) => {
        userAddress.value = address;
        isLoggedIn.value = true;
        sessionStorage.setItem('userAddress', address);
    };

    const logout = () => {
        userAddress.value = null;
        isLoggedIn.value = false;
        sessionStorage.removeItem('userAddress');
    };

    return {
        userAddress,
        isLoggedIn,
        login,
        logout,
    };
});