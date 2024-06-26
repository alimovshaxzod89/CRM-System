
<template>
    <div>
        <div class="card">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Add Teacher" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)"  />
                </template>
            </Toolbar>

            <DataTable 
                ref="dt" 
                :value="teachersArray" 
                v-model:selection="selectedTeachers" 
                dataKey="id"
                :paginator="true" :rows="10" :filters="filters"
                :sortOrder="1" 
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} teachers">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Teachers</h4>
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

                <Column field="science" header="Science" sortable style="min-width:12rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.science" />
                    </template>
                </Column>

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

                <Column field="gender" header="Gender" sortable style="min-width:12rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.gender"  />
                    </template>
                </Column>

                <Column :exportable="false" v-if="!isArRole" style="min-width:9rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editTeacher(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteTeacher(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="teacherDialog" :style="{width: '450px'}" header="Add Teacher" :modal="true" class="p-fluid">
            <div class="field">
                <label for="name">Name</label>
                <InputText id="name" v-model.trim="teacher.name" required="true" autofocus :invalid="submitted && !teacher.name" />
                <small class="p-error" v-if="submitted && !teacher.name">Name is required.</small>
            </div>
            <div class="field">
                <label for="description">Metrka/Pasport Number</label>
                <InputText id="pasportNum" v-model="teacher.pasportNum" required="true" :invalid="submitted && !teacher.name" />
                <small class="p-error" v-if="submitted && !teacher.pasportNum">Pasport Number is required.</small>
            </div>
            

            <div class="field">
                <label for="telNumber">Phone Number</label>
                <InputMask id="telNumber" v-model="teacher.telNumber" mask="(99)999-99-99" placeholder="(99)999-99-99" required="true" :invalid="submitted && !teacher.telNumber"  />
            </div>

            <div class="field">
                <label for="dateBirth">Birth Day</label>
                <Calendar v-model="teacher.dateBirth" dateFormat="dd/mm/yy" />
            </div>

            <div class="field">
				<label for="gender" class="mb-3">Gender</label>
				<Dropdown id="gender" v-model="teacher.gender" :options="statuses" optionLabel="label" placeholder="Select gender of the teacher">
					<template #value="slotProps">
						<div v-if="slotProps.value && slotProps.value.value">
                            <Tag :value="slotProps.value.value"  />
                        </div>
                        <div v-else-if="slotProps.value && !slotProps.value.value">
                            <Tag :value="slotProps.value"  />
                        </div>
						<span v-else>
							{{slotProps.placeholder}}
						</span>
					</template>
				</Dropdown>
			</div>

            <div class="field">
                <label for="science" class="mb-3">Science</label>
                <Dropdown id="science" v-model="teacher.science" :options="coursesArray" optionLabel="name" placeholder="Select Science of the teacher">
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

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="saveTeacher" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteTeacherDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="teacher">Are you sure you want to delete <b>{{teacher.name}}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteTeacherDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deleteTeacher" />
            </template>
        </Dialog>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useToast } from 'primevue/usetoast';
import { useTeachersStore } from './TeachersStoreModule'


const teachersStore = useTeachersStore();
const teachersArray = ref([]);
const coursesArray = ref([]);
const toast = useToast();
const dt = ref();
const teacher = ref({});
const teachers = ref([]);
const teacherDialog = ref(false);
const deleteTeacherDialog = ref(false);
const selectedTeachers = ref();
const filters = ref({
    'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);
const statuses = ref([
    {label: 'Male', value: 'male'},
    {label: 'Female', value: 'female'},
]);


onMounted(() => {
    teachersStore.fetchTeachers().then(() => {
        if (typeof teachersStore.teachers === 'object' && teachersStore.teachers !== null) {
    
            teachersArray.value = Object.keys(teachersStore.teachers).map(key => ({
                id: key,
                ...teachersStore.teachers[key]
            }));
        } else {
            console.error("Teachers data is not an object:", teachersStore.teachers);
        }
    }).catch(error => {
        console.error("Error fetching teachers:", error);
    });

    teachersStore.fetchCourses().then(() => {
        if (typeof teachersStore.courses === 'object' && teachersStore.courses !== null) {
    
            coursesArray.value = Object.keys(teachersStore.courses).map(key => ({
                id: key,
                ...teachersStore.courses[key]
            }));
        } else {
            console.error("Teachers data is not an object:", teachersStore.teachers);
        }
    }).catch(error => {
        console.error("Error fetching teachers:", error);
    });

});

const isArRole = computed(() => localStorage.getItem('role') === 'ar');

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
};

const openNew = () => {
    teacher.value = {};
    submitted.value = false;
    teacherDialog.value = true;
};
const hideDialog = () => {
    teacherDialog.value = false;
    submitted.value = false; 
    teacher.value = {};
};

const saveTeacher = async () => {
    submitted.value = true;

    if (teacher?.value.name?.trim()) {
        try {
            if (teacher.value.id) {
                await updateTeacher();
            } else {
        
                teacher.value.gender = teacher.value.gender ? teacher.value.gender.value : 'Male';
                teacher.value.science = teacher.value.science.name;
                const newTeacher = await teachersStore.saveTeacher(teacher.value);

        
                teachersArray.value.push(newTeacher);

                toast.add({ severity: 'success', summary: 'Successful', detail: 'Teacher Created', life: 3000 });

        
                teacherDialog.value = false;
        
                teacher.value = {};
            }
        } catch (error) {
            console.error('Error saving teacher:', error.message);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save teacher', life: 3000 });
        }
    }
};

const updateTeacher = async () => {
    try {

        teacher.value.gender = teacher.value.gender.value ? teacher.value.gender.value : teacher.value.gender;
        teacher.value.science = teacher.value.science.name;
        await teachersStore.updateTeacher(teacher.value);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Teacher Updated', life: 3000 });


        const index = teachersArray.value.findIndex(s => s.id === teacher.value.id);
        if (index !== -1) {
            teachersArray.value[index] = { ...teacher.value };
        }


        teacherDialog.value = false;

        teacher.value = {};
    } catch (error) {
        console.error('Error updating teacher:', error.message);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update teacher', life: 3000 });
    }
};

const deleteTeacher = async () => {
    try {

        await teachersStore.deleteTeacher(teacher.value.id);
        

        teachersArray.value = teachersArray.value.filter(s => s.id !== teacher.value.id);
        

        deleteTeacherDialog.value = false;
        

        toast.add({ severity: 'success', summary: 'Successful', detail: 'Teacher Deleted', life: 3000 });
        

        teacher.value = {};
    } catch (error) {
        console.error('Error deleting teacher:', error.message);

        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete teacher', life: 3000 });
    }
};

const editTeacher = (prod) => {
    const index = teachersArray.value.findIndex(s => s.id === prod.id);
    if (index !== -1) {

        teachersArray.value[index] = { ...prod };
    } else {
        console.error('Teacher not found in the array');
    }
    
    teacher.value = { ...prod };

    const selectedScience = coursesArray.value.find(course => course.name === prod.science);
    if (selectedScience) {
        teacher.value.science = selectedScience;
    } else {
        console.error('Science not found in the dropdown options');
    }

    teacherDialog.value = true;
    submitted.value = false; 
};

const confirmDeleteTeacher = (prod) => {
    teacher.value = prod;
    deleteTeacherDialog.value = true;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

</script>
