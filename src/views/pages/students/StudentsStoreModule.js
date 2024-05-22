import { defineStore } from 'pinia';

export const useStudentsStore = defineStore('students', {
  
  state: () => ({
    students: [],
  }),
  actions: {
    async fetchStudents() {
        try {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students.json`);
            const studentsData = await response.json();
            this.students = Object.keys(studentsData).map(key => ({
                id: key,
                ...studentsData[key]
            }));
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    },

    async saveStudent(studentData) {
        try {
            // Posting data to Firebase API URL
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData)
            });
    
            if (!response.ok) {
                throw new Error('Failed to post data to Firebase API');
            }

            if(!studentData.id){
                const responseData = await response.json();
                console.log('Data posted successfully!');
        
                // New student ID
                const newStudentId = responseData.name;
        
                // Add the ID to the studentData object
                studentData.id = newStudentId;
        
                const updatedResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students/${newStudentId}.json`, {
                    method: 'PATCH', 
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...studentData
                    })
                });
        
                if (!updatedResponse.ok) {
                    throw new Error('Failed to update student with ID from Firebase');
                }
            }
    
    
            // Return the updated student data
            return studentData;
        } catch (error) {
            console.error('Error posting data to Firebase:', error.message);
            throw new Error('Failed to save student');
        }
    },
    
    async updateStudent(studentData) {
        try {
          // Update
          const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students/${studentData.id}.json`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...studentData
            })
          });
  
          if (!response.ok) {
            throw new Error('Failed to update student with ID from Firebase');
          }
  
        } catch (error) {
          console.error('Error updating student:', error.message);
          throw new Error('Failed to update student');
        }
      },
    

    async deleteStudent(studentId) {
        try {
            // Delete the student from the Firebase
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students/${studentId}.json`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete student from the database');
            }
    
            this.students = this.students.filter(student => student.id !== studentId);
            console.log('Student deleted successfully');
    
        } catch (error) {
            console.error('Error deleting student:', error.message);
            throw new Error('Failed to delete student');
        }
    },
    
  },
});
