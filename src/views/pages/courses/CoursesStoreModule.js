import { defineStore } from 'pinia';

export const useCoursesStore = defineStore('courses', {
  
  state: () => ({
    courses: [],
  }),
  actions: {
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

    async saveCourse(courseData) {
        try {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/courses.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(courseData)
            });
    
            if (!response.ok) {
                throw new Error('Failed to post data to Firebase API');
            }

            if(!courseData.id){
                const responseData = await response.json();
                console.log('Data posted successfully!');
                
                const newCourseId = responseData.name;
                
                courseData.id = newCourseId;

                const updatedResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/courses/${newCourseId}.json`, {
                    method: 'PATCH', 
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...courseData
                    })
                });
        
                if (!updatedResponse.ok) {
                    throw new Error('Failed to update course with ID from Firebase');
                }
            }
            return courseData;
        } catch (error) {
            console.error('Error posting data to Firebase:', error.message);
            throw new Error('Failed to save course');
        }
    },
    
    async updateCourse(courseData) {
        try {
          const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/courses/${courseData.id}.json`, {
            method: 'PATCH', 
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...courseData
            })
          });
  
          if (!response.ok) {
            throw new Error('Failed to update course with ID from Firebase');
          }
  
        } catch (error) {
          console.error('Error updating course:', error.message);
          throw new Error('Failed to update course');
        }
      },

    async deleteCourse(courseId) {
        try {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/courses/${courseId}.json`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete course from the database');
            }
            
            this.courses = this.courses.filter(course => course.id !== courseId);
            console.log('Course deleted successfully');
    
        } catch (error) {
            console.error('Error deleting course:', error.message);
            throw new Error('Failed to delete course');
        }
    },
    
  },
});
