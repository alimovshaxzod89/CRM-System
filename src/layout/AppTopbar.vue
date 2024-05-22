<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import { getAuth, signOut } from 'firebase/auth';
const visible = ref(false);


const { layoutConfig, onMenuToggle } = useLayout();

const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const router = useRouter();

onMounted(() => {
    bindOutsideClickListener();

    const tokenExpiration = new Date(localStorage.getItem('fb-token-exp'));

    if (!tokenExpiration || new Date > tokenExpiration) {
        localStorage.removeItem('fb-token');
        localStorage.removeItem('fb-token-exp');
        localStorage.removeItem('role');
        router.push('/auth/login');
    } else {
        console.log("Token is valid.");
    }

});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const logoUrl = computed(() => {
    return `layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});

const onTopBarMenuButton = () => {
    topbarMenuActive.value = !topbarMenuActive.value;
};
const onSettingsClick = () => {
    topbarMenuActive.value = false;
    router.push('/documentation');
};
const topbarMenuClasses = computed(() => {
    return {
        'layout-topbar-menu-mobile-active': topbarMenuActive.value
    };
});

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                topbarMenuActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
};
const isOutsideClicked = (event) => {
    if (!topbarMenuActive.value) return;

    const sidebarEl = document.querySelector('.layout-topbar-menu');
    const topbarEl = document.querySelector('.layout-topbar-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};


const logout = () => {
    try {
        const auth = getAuth();
        signOut(auth);
        localStorage.removeItem('fb-token');
        localStorage.removeItem('fb-token-exp');
        router.push('/auth/login');
    } catch (error) {
        console.error('Error logging out:', error.message);
    }
};
</script>

<template>
    <div class="layout-topbar">
        <!-- <router-link to="/" class="layout-topbar-logo">
            <img :src="logoUrl" alt="logo" />
            <span>SAKAI</span>
        </router-link> -->

        <button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button>

        <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton()">
            <i class="pi pi-ellipsis-v"></i>
        </button>

        <div class="layout-topbar-menu" :class="topbarMenuClasses">
            
            <button @click="visible = true"  class="p-link layout-topbar-button">
                <i class='bx bx-log-out'></i>
                <span>Profile</span>
            </button>

            <!-- <Button label="Show" @click="visible = true" /> -->

            <Dialog v-model:visible="visible" modal header="Confirm Log out" :style="{ width: '25rem' }">
                <h4 class="p-text-secondary block mb-5">Are you sure you want to log out?</h4>

                <div class="flex justify-content-end gap-2">
                    <Button type="button" label="No" severity="secondary" @click="visible = false"></Button>
                    <Button type="button" label="Yes" severity="danger" @click="logout()"></Button>
                </div>
            </Dialog>
        </div>


    </div>
</template>

<style lang="scss" scoped></style>

