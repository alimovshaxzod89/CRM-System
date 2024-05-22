<template>
    <div>
        <div class="card">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Add Payment" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="paymentsArray"
                v-model:selection="selectedPayments"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :sortOrder="1"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} payments"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Payments</h4>
                        <IconField iconPosition="left">
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>

                <Column header="#" headerStyle="width:3rem">
                    <template #body="slotProps">
                        {{ slotProps.index + 1 }}
                    </template>
                </Column>
                
                <Column field="group.groupName" header="Group Name" sortable style="min-width:12rem"></Column>

                <Column field="student.name" header="Name" sortable style="min-width:12rem"></Column>

                <Column field="student.pasportNum" header="Pasport Number" sortable style="min-width:12rem"></Column>
                
                <Column field="amount" header="Amount" sortable style="min-width:12rem">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.amount) }}
                    </template>
                </Column>

                <Column header="Start Date" dataType="startDate" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.startDate) }}
                    </template>
                </Column>

                <Column header="End Date" dataType="endDate" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.endDate) }}
                    </template>
                </Column>

                <Column field="group.science" header="Science" sortable style="min-width:12rem"></Column>
                
                <Column :exportable="false" style="min-width:9rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" v-if="!isArRole" outlined rounded class="mr-2" @click="editPayment(slotProps.data)" />
                        <Button icon="pi pi-trash" v-if="!isArRole" outlined rounded severity="danger" @click="confirmDeletePayment(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="paymentDialog" :style="{ width: '450px' }" header="Add Payment" :modal="true" class="p-fluid">
            
            <div class="field">
                <label for="group" class="mb-3">Groups</label>
                <Dropdown id="group" v-model="payment.group" :options="groupsArray" required="true" optionLabel="groupName" placeholder="Select the group" @change="updateStudents">
                    <template #value="slotProps">
                        <div v-if="slotProps.value">
                            {{ slotProps.value.groupName }}
                        </div>
                        <span v-else>
                            {{ slotProps.placeholder }}
                        </span>
                    </template>
                </Dropdown>
            </div>

            <div class="field">
                <label for="student" class="mb-3">Students</label>
                <Dropdown id="student" v-model="payment.student" :options="filteredStudents" required="true" optionLabel="name" placeholder="Select a student">
                    <template #value="slotProps">
                        <div v-if="slotProps.value">
                            {{ slotProps.value.name }}
                        </div>
                        <span v-else>
                            {{ slotProps.placeholder }}
                        </span>
                    </template>
                </Dropdown>
            </div>

            <div class="field">
                <label for="integeronly" class="font-bold block mb-2"> Payment amount </label>
                <InputNumber v-model="payment.amount" inputId="integeronly" required="true" />
            </div>

            <div class="field">
                <label for="startDate">Start Date</label>
                <Calendar v-model="payment.startDate" dateFormat="dd/mm/yy" required="true" />
            </div>

            <div class="field">
                <label for="endDate">End Date</label>
                <Calendar v-model="payment.endDate" dateFormat="dd/mm/yy" required="true" />
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" text @click="savePayment" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deletePaymentDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="payment">Are you sure you want to delete <b>{{ payment.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deletePaymentDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deletePayment" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deletePaymentsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="payment">Are you sure you want to delete the selected Payments?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deletePaymentsDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedPayments" />
            </template>
        </Dialog>
    </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useToast } from 'primevue/usetoast';
import { usePaymentsStore } from './PaymentsStoreModule';

const paymentsStore = usePaymentsStore();
const paymentsArray = ref([]);
const groupsArray = ref([]);
const studentsArray = ref([]); // Array to store students
const toast = useToast();
const dt = ref();
const payment = ref({});
const paymentDialog = ref(false);
const deletePaymentDialog = ref(false);
const deletePaymentsDialog = ref(false);
const selectedPayments = ref();
const filters = ref({
    'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const submitted = ref(false);
const statuses = ref([
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
]);

onMounted(() => {
    paymentsStore.fetchGroups().then(() => {
        if (typeof paymentsStore.groups === 'object' && paymentsStore.groups !== null) {
            groupsArray.value = Object.keys(paymentsStore.groups).map(key => ({
                id: key,
                ...paymentsStore.groups[key]
            }));
        } else {
            console.error("Groups data is not an object:", paymentsStore.groups);
        }
    }).catch(error => {
        console.error("Error fetching groups:", error);
    });

    paymentsStore.fetchPayments().then(() => {
        if (typeof paymentsStore.payments === 'object' && paymentsStore.payments !== null) {
            paymentsArray.value = Object.keys(paymentsStore.payments).map(key => ({
                id: key,
                ...paymentsStore.payments[key]
            }));
        } else {
            console.error("Payments data is not an object:", paymentsStore.payments);
        }
    }).catch(error => {
        console.error("Error fetching payments:", error);
    });
});

const filteredStudents = computed(() => {
    if (payment.value.group) {
        return payment.value.group.students || [];
    }
    return [];
});

const updateStudents = () => {
    // When the group is updated, the filteredStudents computed property will reactively update the students for the second dropdown
};

const isArRole = computed(() => localStorage.getItem('role') === 'ar');

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
    }).format(value).replace(/,/g, ' ');
};

const openNew = () => {
    payment.value = {};
    submitted.value = false;
    paymentDialog.value = true;
};
const hideDialog = () => {
    paymentDialog.value = false;
    submitted.value = false;
    payment.value = {};
};

const savePayment = async () => {
    submitted.value = true;

    if (payment?.value.student?.name?.trim()) {
        try {
            if (payment.value.id) {
                await updatePayment();
            } else {
                // Fetch the current amountSum for the group
                const groupResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/groups/${payment.value.group.id}.json`);
                if (!groupResponse.ok) {
                    throw new Error('Failed to fetch group data');
                }
                const groupData = await groupResponse.json();

                // Calculate the new amountSum
                const newAmountSum = (groupData.amountSum || 0) + payment.value.amount;

                // Update the payment data in the database
                const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/payments.json`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payment.value)
                });

                if (!response.ok) {
                    throw new Error('Failed to post data to Firebase API');
                }

                const responseData = await response.json();
                const newPaymentId = responseData.name;
                payment.value.id = newPaymentId;

                const updatedResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/payments/${newPaymentId}.json`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payment.value)
                });

                if (!updatedResponse.ok) {
                    throw new Error('Failed to update payment with ID from Firebase');
                }

                // Update the student's data
                const studentUpdateResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students/${payment.value.student.id}.json`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        startPaymentDate: payment.value.startDate,
                        endPaymentDate: payment.value.endDate
                    })
                });

                if (!studentUpdateResponse.ok) {
                    throw new Error('Failed to update student data');
                }

                // Update the group amountSum
                const groupUpdateResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/groups/${payment.value.group.id}.json`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amountSum: newAmountSum
                    })
                });

                if (!groupUpdateResponse.ok) {
                    throw new Error('Failed to update group amountSum');
                }

                paymentsArray.value.push(payment.value);
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Payment Created', life: 3000 });
                paymentDialog.value = false;
                payment.value = {};
            }
        } catch (error) {
            console.error('Error saving payment:', error.message);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save payment', life: 3000 });
        }
    }
};



const updatePayment = async () => {
    try {
        // Fetch the current payment data
        const paymentResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/payments/${payment.value.id}.json`);
        if (!paymentResponse.ok) {
            throw new Error('Failed to fetch payment data');
        }
        const oldPaymentData = await paymentResponse.json();

        // Fetch the current amountSum for the group
        const groupResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/groups/${payment.value.group.id}.json`);
        if (!groupResponse.ok) {
            throw new Error('Failed to fetch group data');
        }
        const groupData = await groupResponse.json();

        // Calculate the new amountSum
        const newAmountSum = (groupData.amountSum || 0) - oldPaymentData.amount + payment.value.amount;

        const response = await fetch(`${import.meta.env.VITE_FB_DB_URL}/payments/${payment.value.id}.json`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payment.value)
        });

        if (!response.ok) {
            throw new Error('Failed to update payment with ID from Firebase');
        }

        // Update the student's data
        const studentUpdateResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/students/${payment.value.student.id}.json`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                startPaymentDate: payment.value.startDate,
                endPaymentDate: payment.value.endDate
            })
        });

        if (!studentUpdateResponse.ok) {
            throw new Error('Failed to update student data');
        }

        // Update the group amountSum
        const groupUpdateResponse = await fetch(`${import.meta.env.VITE_FB_DB_URL}/groups/${payment.value.group.id}.json`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amountSum: newAmountSum
            })
        });

        if (!groupUpdateResponse.ok) {
            throw new Error('Failed to update group amountSum');
        }

        toast.add({ severity: 'success', summary: 'Successful', detail: 'Payment Updated', life: 3000 });
        const index = paymentsArray.value.findIndex(s => s.id === payment.value.id);
        if (index !== -1) {
            paymentsArray.value[index] = { ...payment.value };
        }
        paymentDialog.value = false;
        payment.value = {};
    } catch (error) {
        console.error('Error updating payment:', error.message);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update payment', life: 3000 });
    }
};


const deletePayment = async () => {
    try {
        await paymentsStore.deletePayment(payment.value.id);
        paymentsArray.value = paymentsArray.value.filter(s => s.id !== payment.value.id);
        deletePaymentDialog.value = false;
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Payment Deleted', life: 3000 });
        payment.value = {};
    } catch (error) {
        console.error('Error deleting payment:', error.message);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete payment', life: 3000 });
    }
};

const editPayment = (prod) => {
    const index = paymentsArray.value.findIndex(s => s.id === prod.id);
    if (index !== -1) {
        paymentsArray.value[index] = { ...prod };
    } else {
        console.error('Payment not found in the array');
    }
    payment.value = { ...prod };
    paymentDialog.value = true;
    submitted.value = false;
};

const confirmDeletePayment = (prod) => {
    payment.value = prod;
    deletePaymentDialog.value = true;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const confirmDeleteSelected = () => {
    deletePaymentsDialog.value = true;
};

const deleteSelectedPayments = () => {
    payments.value = payments.value.filter(val => !selectedPayments.value.includes(val));
    deletePaymentsDialog.value = false;
    selectedPayments.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Payments Deleted', life: 3000 });
};
</script>
