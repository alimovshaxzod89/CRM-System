import { defineStore } from 'pinia';

export const useGroupsStore = defineStore('groupsStore', {
    state: () => ({
        groups: {},
        teachers: {},
        students: {},
        courses: {}
    }),
    actions: {
        async fetchGroups() {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/groups.json`);
            if (response.ok) {
                this.groups = await response.json();
            } else {
                throw new Error('Failed to fetch groups');
            }
        },
        async fetchTeachers() {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/teachers.json`);
            if (response.ok) {
                this.teachers = await response.json();
            } else {
                throw new Error('Failed to fetch teachers');
            }
        },
        async fetchStudents() {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students.json`);
            if (response.ok) {
                this.students = await response.json();
            } else {
                throw new Error('Failed to fetch students');
            }
        },
        async fetchCourses() {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/courses.json`);
            if (response.ok) {
                this.courses = await response.json();
            } else {
                throw new Error('Failed to fetch courses');
            }
        },
        async saveGroup(groupData) {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/groups.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(groupData)
            });

            if (response.ok) {
                const responseData = await response.json();
                const newGroup = { id: responseData.name, ...groupData };
                this.groups[responseData.name] = newGroup;
                return newGroup;
            } else {
                throw new Error('Failed to save group');
            }
        },
        async updateGroup(groupData) {
            try {
                const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/groups/${groupData.id}.json`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(groupData)
                });

                if (!response.ok) {
                    throw new Error('Failed to update group with ID from Firebase');
                }

                // Update the local state
                this.groups[groupData.id] = { ...groupData };

            } catch (error) {
                console.error('Error updating group:', error.message);
                throw new Error('Failed to update group');
            }
        },
        async deleteGroup(groupId) {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/groups/${groupId}.json`, {
                method: 'DELETE'
            });

            if (response.ok) {
                delete this.groups[groupId];
            } else {
                throw new Error('Failed to delete group');
            }
        }
    }
});
