import { createRouter, createWebHashHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import { getAuth } from 'firebase/auth';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            redirect: '/auth/login', // Redirect root path to login
        },
        {
            path: '/students',
            component: AppLayout,
            children: [
                {
                    path: '',
                    name: 'students',
                    component: () => import('@/views/pages/students/Students.vue')
                },
                {
                    path: '/teachers',
                    name: 'teachers',
                    component: () => import('@/views/pages/teachers/Teachers.vue')
                },
                {
                    path: '/courses',
                    name: 'courses',
                    component: () => import('@/views/pages/courses/Courses.vue')
                },
                {
                    path: '/groups',
                    name: 'groups',
                    component: () => import('@/views/pages/groups/Groups.vue')
                },
                {
                    path: '/payments',
                    name: 'payments',
                    component: () => import('@/views/pages/payments/Payments.vue')
                },
            ]
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue'),
            meta: {
                requiresAuth: false // Indicate that this route doesn't require authentication
            }
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('fb-token'); // Check if user is authenticated
    if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
        next('/auth/login'); // Redirect to login if not authenticated
    } else {
        next(); // Proceed to route
    }
});

export default router;
