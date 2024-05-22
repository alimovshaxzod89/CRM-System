<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref, computed, reactive } from 'vue';
import AppConfig from '@/layout/AppConfig.vue';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const { layoutConfig } = useLayout();

const logoUrl = computed(() => {
    return `layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});


const router = useRouter();
const email = ref('');
const password = ref('');
const errMsg = ref(); 
const selectedRole = ref();
const roles = ref([
    { name: 'Administrator', code: 'ar' },
    { name: 'Admin', code: 'an' },
]);

const login = () => {
    const auth = getAuth();
    signInWithEmailAndPassword(auth, email.value, password.value)
        .then((data) => {

            const expDate = new Date(new Date().getTime() + +data._tokenResponse.expiresIn * 1000);
            localStorage.setItem('fb-token', data._tokenResponse.idToken);
            localStorage.setItem('fb-token-exp', expDate.toString());
            localStorage.setItem('role', selectedRole.value.code)
            router.push('/students')
        })
        .catch(error => {
            console.log(error);
            switch(error.code){
                case "auth/invalid-email":
                errMsg.value = "Invalid email";
                break;

                case "auth/user-not-found":
                errMsg.value = "No account with that email was found";
                break;

                case "auth/wrong-password":
                errMsg.value = "Incorrect password";
                break;

                default: 
                errMsg.value = "Email or password was incorrect";
                break;
            }
            alert(error.message);
        });
}

const formValid = computed(() => {
    const emailValid = validateEmail(email.value);
    const passwordValid = validatePassword(password.value);
    
    if (!emailValid || !passwordValid || !selectedRole.value) {
        return false;
    }
    
    const emailPrefix = email.value.substring(0, 2);
    return emailPrefix.toLowerCase() === selectedRole.value.code.substring(0, 2).toLowerCase();
});

function validateEmail(email) {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // Password validation logic here (if any)
    // Example: Minimum length, special characters, etc.
    return password.length >= 6; // Example: Password must be at least 6 characters long
}

</script>

<template>
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <img :src="logoUrl" alt="Sakai logo" class="mb-5 w-6rem flex-shrink-0" />
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                    <div class="text-center mb-5">
                        <div class="text-900 text-3xl font-medium mb-3">Welcome To Our CRM System!</div>
                        <span class="text-600 font-medium">Sign in to continue</span>
                    </div>

                    <div>
                        <form @submit.prevent="login">

                            <label for="email1" class="block text-900 text-xl font-medium mb-2">Email</label>
                            <InputText v-model="email" id="email1" type="text" placeholder="Email address" class="w-full md:w-32rem mb-5" style="padding: 1rem" />

                            <label for="password1" class="block text-900 font-medium text-xl mb-2">Password</label>
                            <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" :feedback="false" class="w-full mb-5" inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>

                            <label class="text-900 text-xl font-medium mb-2">Role</label>
                            <Dropdown v-model="selectedRole" :options="roles" optionLabel="name" placeholder="Select a Role" class=" w-full mt-2 mb-5" />
                            
                            
                            <small v-if="errMsg" id="username-help" class="p-error">{{ errMsg }} <hr> </small>

                            
                            <!-- <div class="flex align-items-center justify-content-between mb-5 gap-5">
                                <div class="flex align-items-center">
                                    <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                    <label for="rememberme1">Remember me</label>
                                </div>
                                <a class="font-medium no-underline ml-2 text-right cursor-pointer" style="color: var(--primary-color)">Forgot password?</a>
                            </div> -->
                            <Button :disabled="!formValid" type="submit" label="Sign In" class="w-full p-3 text-xl"></Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <AppConfig simple />
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
