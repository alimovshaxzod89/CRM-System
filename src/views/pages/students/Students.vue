
<template>
    <div>
        <div class="card">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Add Student" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)"  />
                </template>
            </Toolbar>

            <DataTable 
                ref="dt" 
                :value="studentsArray" 
                v-model:selection="selectedStudents" 
                dataKey="id"
                :paginator="true" :rows="10" :filters="filters"
                :sortOrder="1" 
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} students">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Students</h4>
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

                <Column field="name" header="Name" sortable style="min-width:12rem"></Column>
                <Column field="pasportNum" header="Metrka/Pasport Number" sortable style="min-width:12rem"></Column>
                <Column field="telNumber" header="Phone Number" sortable style="min-width:12rem">
                    <template #body="{data}">
                        {{ data.telNumber }}
                    </template>
                </Column>

                <Column header="Birth Day" dataType="date" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.dateBirth) }}
                    </template>
                </Column>

                <Column header="Date received" dataType="date" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.receivedDate) }}
                    </template>
                </Column>

                <Column header="Days Paid" dataType="startPaymentDate" style="min-width: 12rem">
                    <template #body="{ data }">
                        <span :class="getDaysPaidClass(data.endPaymentDate)">
                            {{ data.endPaymentDate ? 
                                (daysPaid(data.endPaymentDate) > 1 ? daysPaid(data.endPaymentDate) + ' days' : 
                                (daysPaid(data.endPaymentDate) < 1 ? '-' : daysPaid(data.endPaymentDate) + ' day')) 
                                : '-' }}
                        </span>
                    </template>
                </Column>

                <Column field="gender" header="Gender" sortable style="min-width:12rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.gender" :severity="getStatusLabel(slotProps.data.gender)" />
                    </template>
                </Column>

                <Column :exportable="false" v-if="!isArRole" style="min-width:9rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editStudent(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteStudent(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>

        </div>

        <Dialog v-model:visible="productDialog" :style="{width: '450px'}" header="Add Student" :modal="true" class="p-fluid">
            <div class="field">
                <label for="name">Name</label>
                <InputText id="name" v-model.trim="student.name" required="true" autofocus :invalid="submitted && !student.name" />
                <small class="p-error" v-if="submitted && !student.name">Name is required.</small>
            </div>
            <div class="field">
                <label for="description">Metrka/Pasport Number</label>
                <InputText id="pasportNum" v-model="student.pasportNum" required="true" :invalid="submitted && !student.name" />
                <small class="p-error" v-if="submitted && !student.pasportNum">Pasport Number is required.</small>
            </div>

            <div class="field">
                <label for="telNumber">Phone Number</label>
                <InputMask id="telNumber" v-model="student.telNumber" mask="(99)999-99-99" placeholder="(99)999-99-99" required="true" :invalid="submitted && !student.telNumber"  />
            </div>

            <div class="field">
				<label for="gender" class="mb-3">Gender</label>
				<Dropdown id="gender" v-model="student.gender" :options="statuses" optionLabel="label" placeholder="Select gender of the student">
					<template #value="slotProps">
						<div v-if="slotProps.value && slotProps.value.value">
                            <Tag :value="slotProps.value.value" :severity="getStatusLabel(slotProps.value.label)" />
                        </div>
                        <div v-else-if="slotProps.value && !slotProps.value.value">
                            <Tag :value="slotProps.value" :severity="getStatusLabel(slotProps.value)" />
                        </div>
						<span v-else>
							{{slotProps.placeholder}}
						</span>
					</template>
				</Dropdown>
			</div>

            <div class="field">
                <label for="dateBirth">Birth Day</label>
                <Calendar v-model="student.dateBirth" dateFormat="dd/mm/yy" />
            </div>

            <div class="field">

                <label for="receivedDate">Received Date</label>
                <Calendar v-model="student.receivedDate" dateFormat="dd/mm/yy" />
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="saveStudent" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteStudentDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="student">Are you sure you want to delete <b>{{student.name}}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteStudentDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deleteStudent" />
            </template>
        </Dialog>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useToast } from 'primevue/usetoast';
import { useStudentsStore } from './StudentsStoreModule'

const toast = useToast();
const dt = ref();
const student = ref({});
const students = ref([]);
const productDialog = ref(false);
const deleteStudentDialog = ref(false);
const selectedStudents = ref();
const filters = ref({
    'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);
const statuses = ref([
    {label: 'Male', value: 'male'},
    {label: 'Female', value: 'female'},
]);

const studentsStore = useStudentsStore()
const studentsArray = ref([]);

const isArRole = computed(() => localStorage.getItem('role') === 'ar');

onMounted(() => {
    studentsStore.fetchStudents().then(() => {
        if (typeof studentsStore.students === 'object' && studentsStore.students !== null) {
            studentsArray.value = Object.keys(studentsStore.students).map(key => ({
                id: key,
                ...studentsStore.students[key]
            }));
        } else {
            console.error("Students data is not an object:", studentsStore.students);
        }
    }).catch(error => {
        console.error("Error fetching students:", error);
    });
});

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
};

const daysPaid = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const getDaysPaidClass = (endDate) => {
    if (!endDate) return 'days-paid-default';
    const days = daysPaid(endDate);
    if (days > 10) {
        return 'days-paid-green';
    } else if (days >= 3 && days <= 9) {
        return 'days-paid-yellow';
    } else if (days < 3) {
        return 'days-paid-red';
    } else {
        return 'days-paid-default';
    }
};

const openNew = () => {
    student.value = {};
    submitted.value = false;
    productDialog.value = true;
};

const hideDialog = () => {
    productDialog.value = false;
    submitted.value = false; 
    student.value = {};
};

const saveStudent = async () => {
    submitted.value = true;

    if (student?.value.name?.trim()) {
        try {
            if (student.value.id) {
                await updateStudent();
            } else {
                student.value.gender = student.value.gender ? student.value.gender.value : 'Male';
                const newStudent = await studentsStore.saveStudent(student.value);
                studentsArray.value.push(newStudent);
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Student Created', life: 3000 });
                productDialog.value = false;
                student.value = {};
            }
        } catch (error) {
            console.error('Error saving student:', error.message);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save student', life: 3000 });
        }
    }
};

const updateStudent = async () => {
    try {
        student.value.gender = student.value.gender.value ? student.value.gender.value : student.value.gender;
        await studentsStore.updateStudent(student.value);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Student Updated', life: 3000 });
        const index = studentsArray.value.findIndex(s => s.id === student.value.id);
        if (index !== -1) {
            studentsArray.value[index] = { ...student.value };
        }
        productDialog.value = false;
        student.value = {};
    } catch (error) {
        console.error('Error updating student:', error.message);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update student', life: 3000 });
    }
};

const deleteStudent = async () => {
    try {
        await studentsStore.deleteStudent(student.value.id);
        studentsArray.value = studentsArray.value.filter(s => s.id !== student.value.id);
        deleteStudentDialog.value = false;
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Student Deleted', life: 3000 });
        student.value = {};
    } catch (error) {
        console.error('Error deleting student:', error.message);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete student', life: 3000 });
    }
};

const editStudent = (prod) => {
    const index = studentsArray.value.findIndex(s => s.id === prod.id);
    if (index !== -1) {
        studentsArray.value[index] = { ...prod };
    } else {
        console.error('Student not found in the array');
    }
    student.value = { ...prod };
    productDialog.value = true;
    submitted.value = false; 
};

const confirmDeleteStudent = (prod) => {
    student.value = prod;
    deleteStudentDialog.value = true;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'Male':
            return 'male';
        case 'Female':
            return 'female';
        default:
            return null;
    }
};
</script>

<style scoped>
.days-paid-green {
    background-color: rgb(0, 255, 0);
    padding: 5px 10px;
}

.days-paid-yellow {
    background-color: yellow;
    padding: 5px 10px;
}

.days-paid-red {
    background-color: red;
    color: white;
    padding: 5px 10px;
}

.days-paid-default {
    background-color: transparent;
}

</style>
