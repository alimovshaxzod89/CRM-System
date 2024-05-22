import { createRouter, createWebHashHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import { getAuth } from 'firebase/auth';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/students',
            component: AppLayout,
            children: [
                {
                    path: '/students',
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
        // {
        //     path: '/landing',
        //     name: 'landing',
        //     component: () => import('@/views/pages/Landing.vue')
        // },
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

export default router;
