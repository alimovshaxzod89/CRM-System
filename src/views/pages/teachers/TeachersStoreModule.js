import { defineStore } from 'pinia';

export const useTeachersStore = defineStore('teachers', {
  
  state: () => ({
    teachers: [],
    courses: []
  }),
  actions: {
    async fetchTeachers() {
        try {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/teachers.json`);
            const teachersData = await response.json();
            this.teachers = Object.keys(teachersData).map(key => ({
                id: key,
                ...teachersData[key]
            }));
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    },

    async saveTeacher(teacherData) {
        try {
            // Posting data to Firebase API URL
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/teachers.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(teacherData)
            });
    
            if (!response.ok) {
                throw new Error('Failed to post data to Firebase API');
            }

            if(!teacherData.id){
                const responseData = await response.json();
        
                const newTeacherId = responseData.name;
        
                teacherData.id = newTeacherId;
        
                const updatedResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/teachers/${newTeacherId}.json`, {
                    method: 'PATCH', // or PUT
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...teacherData
                    })
                });
        
                if (!updatedResponse.ok) {
                    throw new Error('Failed to update teacher with ID from Firebase');
                }
            }
    
    
            // Return the updated teacher data
            return teacherData;
        } catch (error) {
            console.error('Error posting data to Firebase:', error.message);
            throw new Error('Failed to save teacher');
        }
    },
    
    async updateTeacher(teacherData) {
        try {
          // Update
          const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/teachers/${teacherData.id}.json`, {
            method: 'PATCH', // or PUT
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...teacherData
            })
          });
  
          if (!response.ok) {
            throw new Error('Failed to update teacher with ID from Firebase');
          }
        } catch (error) {
          console.error('Error updating teacher:', error.message);
          throw new Error('Failed to update teacher');
        }
      },

    async deleteTeacher(teacherId) {
        try {
            // Delete the teacher from the Firebase
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/teachers/${teacherId}.json`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete teacher from the database');
            }
            this.teachers = this.teachers.filter(teacher => teacher.id !== teacherId);
            console.log('Teacher deleted successfully');
    
        } catch (error) {
            console.error('Error deleting teacher:', error.message);
            throw new Error('Failed to delete teacher');
        }
    },

    async fetchCourses() {
        try {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/courses.json`);
            const coursesData = await response.json();
            this.courses = Object.keys(coursesData).map(key => ({
                id: key,
                ...coursesData[key]
            }));
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    },
    
  },
});
