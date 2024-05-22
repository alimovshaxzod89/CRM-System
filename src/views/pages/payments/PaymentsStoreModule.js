import { defineStore } from 'pinia'
export const usePaymentsStore = defineStore('payments', {
    state: () => ({
      payments: [],
      courses: [],
      groups: [],
    }),
    actions: {
      async fetchGroups() {
        try {
          const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/groups.json`);
          if (response.ok) {
            this.groups = await response.json();
          } else {
            throw new Error('Failed to fetch groups');
          }
        } catch (error) {
          console.error("Error fetching groups:", error);
        }
      },
  
      async fetchPayments() {
        try {
          const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/payments.json`);
          const paymentsData = await response.json();
          this.payments = Object.keys(paymentsData).map(key => ({
            id: key,
            ...paymentsData[key]
          }));
        } catch (error) {
          console.error('Error fetching payments:', error);
        }
      },
  
      async savePayment(paymentData) {
        try {
            const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/payments.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });
    
            if (!response.ok) {
                throw new Error('Failed to post data to Firebase API');
            }
    
            const responseData = await response.json();
            const newPaymentId = responseData.name;
            paymentData.id = newPaymentId;
    
            const updatedResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/payments/${newPaymentId}.json`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });
    
            if (!updatedResponse.ok) {
                throw new Error('Failed to update payment with ID from Firebase');
            }
    
            // Update the student's data
            const studentUpdateResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students/${paymentData.student.id}.json`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startPaymentDate: paymentData.startDate,
                    endPaymentDate: paymentData.endDate
                })
            });
    
            if (!studentUpdateResponse.ok) {
                throw new Error('Failed to update student data');
            }
    
            return paymentData;
        } catch (error) {
            console.error('Error posting data to Firebase:', error.message);
            throw new Error('Failed to save payment');
        }
    },
    
  
      async updatePayment(paymentData) {
        try {
          const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/payments/${paymentData.id}.json`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
          });

          if (!response.ok) {
            throw new Error('Failed to update payment with ID from Firebase');
          }

            // Update the student's data
                const studentUpdateResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students/${paymentData.student.id}.json`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startPaymentDate: paymentData.startDate,
                    endPaymentDate: paymentData.endDate
                })
            });

            if (!studentUpdateResponse.ok) {
                throw new Error('Failed to update student data');
            }
  
          
        } catch (error) {
          console.error('Error updating payment:', error.message);
          throw new Error('Failed to update payment');
        }
      },
  
      async deletePayment(paymentId) {
        try {
          const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/payments/${paymentId}.json`, {
            method: 'DELETE'
          });
          if (!response.ok) {
            throw new Error('Failed to delete payment from the database');
          }
          this.payments = this.payments.filter(payment => payment.id !== paymentId);
          console.log('Payment deleted successfully');
        } catch (error) {
          console.error('Error deleting payment:', error.message);
          throw new Error('Failed to delete payment');
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
  