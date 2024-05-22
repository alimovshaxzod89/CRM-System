<template>
    <div>
        <div class="card">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Add Group" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)"  />
                </template>
            </Toolbar>

            <DataTable 
                ref="dt" 
                :value="groupsArray" 
                v-model:selection="selectedGroups" 
                dataKey="id"
                :paginator="true" :rows="10" :filters="filters"
                :sortOrder="1" 
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} groups">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Groups</h4>
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

                <Column field="groupName" header="Group Name" sortable style="min-width:12rem"></Column>
                <Column field="science" header="Course" sortable style="min-width:12rem"></Column>
                <Column field="teacher" header="Teacher" sortable style="min-width:12rem"></Column>
                <Column field="description" header="Description" sortable style="min-width:12rem"></Column>
                <Column field="amountSum" header="Amount " sortable style="min-width:9rem">
                    <template #body="slotProps">
                        {{ slotProps.data.amountSum ? formatCurrency(slotProps.data.amountSum): '-' }}
                    </template>
                </Column>
                
                <Column :exportable="false" style="min-width:12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-table" outlined rounded class="mr-2" @click="showTableGroup(slotProps.data)" />
                        <Button icon="pi pi-pencil" v-if="!isArRole" outlined rounded class="mr-2" @click="editGroup(slotProps.data)" />
                        <Button icon="pi pi-trash" v-if="!isArRole" outlined rounded severity="danger" @click="confirmDeleteGroup(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="groupDialog" :style="{width: '450px'}" header="Add Group" :modal="true" class="p-fluid">
            <div class="field">
                <label for="groupName">Group Name</label>
                <InputText id="groupName" v-model.trim="group.groupName" required="true" autofocus :invalid="submitted && !group.groupName" />
                <small class="p-error" v-if="submitted && !group.groupName">Name is required.</small>
            </div>

            <div class="field">
                <label for="subjectName">Course Name</label>
                <Dropdown id="science" v-model="group.science" :options="coursesArray" optionLabel="name" placeholder="Select Science of the group">
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
				<label for="teacher" class="mb-3">Teacher</label>
				<Dropdown id="teacher" v-model="group.teacher" :options="teachersArray" optionLabel="name" placeholder="Select the Teacher">
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
                <label for="description">Schedule / Description</label>
                <Textarea id="description" v-model="group.description" required="true" rows="3" cols="20" />
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="saveGroup" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteGroupDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="group">Are you sure you want to delete <b>{{group.groupName}}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteGroupDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deleteGroup" />
            </template>
        </Dialog>

        <Dialog v-model:visible="tableDialogVisible" :style="{width: '900px'}" header="Group Students" :modal="true">
            <DataTable :value="selectedGroupStudents" :paginator="true" :rows="15" :sortOrder="1" paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Students in {{ selectedGroup.groupName }}</h4>
                        <Button label="Add Student" icon="pi pi-plus" severity="success" @click="openAddStudentDialog" />
                    </div>
                </template>

                <Column header="#" headerStyle="width:3rem">
                    <template #body="slotProps">
                        {{ slotProps.index + 1 }}
                    </template>
                </Column>

                <Column field="name" header="Name" sortable style="min-width:12rem"></Column>
                <Column field="telNumber" header="Phone Number" sortable style="min-width:12rem"></Column>
                <Column field="pasportNum" header="Pasport Number" sortable style="min-width:12rem"></Column>
                <Column field="gender" header="Gender" sortable style="min-width:12rem"></Column>
                <Column :exportable="false" style="min-width:9rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-trash" v-if="!isArRole" outlined rounded severity="danger" @click="confirmDeleteStudent(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </Dialog>

        <Dialog v-model:visible="addStudentDialogVisible" :style="{width: '450px'}" header="Add Student" :modal="true">
            <div class="field">
                <label for="student" class="mb-3 block">Student</label>
                <Dropdown id="student" v-model="selectedStudent" :options="studentsArray" optionLabel="name" style="width: 100%;" placeholder="Select a Student">
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
                <Button label="Cancel" icon="pi pi-times" text @click="hideAddStudentDialog"/>
                <Button label="Add" icon="pi pi-check" text @click="addStudentToGroup" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteStudentDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="studentToDelete">Are you sure you want to delete <b>{{studentToDelete.name}}</b> from the group?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteStudentDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deleteStudentFromGroup" />
            </template>
        </Dialog>

	</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useToast } from 'primevue/usetoast';
import { useGroupsStore } from './GroupsStoreModule';

const toast = useToast();
const dt = ref();
const group = ref({});
const coursesArray = ref([]);
const groups = ref([]);
const teachersArray = ref([]);
const studentsArray = ref([]);
const selectedGroupStudents = ref([]);
const selectedGroup = ref({});
const tableDialogVisible = ref(false);
const groupDialog = ref(false);
const deleteGroupDialog = ref(false);
const selectedGroups = ref();
const filters = ref({
    'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);

const addStudentDialogVisible = ref(false);
const selectedStudent = ref(null);
const deleteStudentDialog = ref(false);
const studentToDelete = ref(null);

const groupsStore = useGroupsStore();
const groupsArray = ref([]);

onMounted(() => {
    fetchData();
});

const fetchData = async () => {
    try {
        await Promise.all([
            groupsStore.fetchGroups(),
            groupsStore.fetchTeachers(),
            groupsStore.fetchStudents(),
            groupsStore.fetchCourses(),
        ]);

        // Populate arrays after fetching
        populateArrays();
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

const populateArrays = () => {
    if (typeof groupsStore.groups === 'object' && groupsStore.groups !== null) {
        groupsArray.value = Object.keys(groupsStore.groups).map(key => ({
            id: key,
            ...groupsStore.groups[key]
        }));
    } else {
        console.error("Groups data is not an object:", groupsStore.groups);
    }

    if (typeof groupsStore.teachers === 'object' && groupsStore.teachers !== null) {
        teachersArray.value = Object.keys(groupsStore.teachers).map(key => ({
            id: key,
            ...groupsStore.teachers[key]
        }));
    } else {
        console.error("Teachers data is not an object:", groupsStore.teachers);
    }

    if (typeof groupsStore.students === 'object' && groupsStore.students !== null) {
        studentsArray.value = Object.keys(groupsStore.students).map(key => ({
            id: key,
            ...groupsStore.students[key]
        }));
    } else {
        console.error("Students data is not an object:", groupsStore.students);
    }

    if (typeof groupsStore.courses === 'object' && groupsStore.courses !== null) {
        coursesArray.value = Object.keys(groupsStore.courses).map(key => ({
            id: key,
            ...groupsStore.courses[key]
        }));
    } else {
        console.error("Courses data is not an object:", groupsStore.courses);
    }
};

const isArRole = computed(() => localStorage.getItem('role') === 'ar');

const showTableGroup = (group) => {
    selectedGroup.value = group;
    selectedGroupStudents.value = studentsArray.value.filter(student => {
        return group.students && group.students.some(s => s.id === student.id);
    });
    tableDialogVisible.value = true;
};

const openNew = () => {
    group.value = {};
    submitted.value = false;
    groupDialog.value = true;
};
const hideDialog = () => {
    groupDialog.value = false;
    submitted.value = false; 
    group.value = {};
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
    }).format(value).replace(/,/g, ' ');
};

const saveGroup = async () => {
    submitted.value = true;

    if (group?.value.groupName?.trim()) {
        try {
            if (group.value.id) {
                await updateGroup();
            } else {
                group.value.teacher = group.value.teacher.name;
                group.value.science = group.value.science.name;
                
                // Ensure group.students is defined
                if (!group.value.students) {
                    group.value.students = [];
                }
                
                const newGroup = await groupsStore.saveGroup(group.value);

                groupsArray.value.push(newGroup);

                toast.add({ severity: 'success', summary: 'Successful', detail: 'Group Created', life: 3000 });

                groupDialog.value = false;
                group.value = {};
            }
        } catch (error) {
            console.error('Error saving group:', error.message);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save group', life: 3000 });
        }
    }
};

const updateGroup = async () => {
    try {
        group.value.teacher = group.value.teacher.name;
        group.value.science = group.value.science.name;
        await groupsStore.updateGroup(group.value);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Group Updated', life: 3000 });

        const index = groupsArray.value.findIndex(s => s.id === group.value.id);
        if (index !== -1) {
            groupsArray.value[index] = { ...group.value };
        }

        groupDialog.value = false;
        group.value = {};
    } catch (error) {
        console.error('Error updating group:', error.message);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update group', life: 3000 });
    }
};

const deleteGroup = async () => {
    try {
        await groupsStore.deleteGroup(group.value.id);

        groupsArray.value = groupsArray.value.filter(s => s.id !== group.value.id);

        deleteGroupDialog.value = false;

        toast.add({ severity: 'success', summary: 'Successful', detail: 'Group Deleted', life: 3000 });

        group.value = {};
    } catch (error) {
        console.error('Error deleting group:', error.message);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete group', life: 3000 });
    }
};

const editGroup = (prod) => {
    const index = groupsArray.value.findIndex(s => s.id === prod.id);
    if (index !== -1) {
        groupsArray.value[index] = { ...prod };
    } else {
        console.error('Group not found in the array');
    }

    group.value = { ...prod };

    const selectedTeacher = teachersArray.value.find(teacher => teacher.name === prod.teacher);
    if (selectedTeacher) {
        group.value.teacher = selectedTeacher;
    } else {
        console.error('Teacher not found in the dropdown options');
    }

    const selectedScience = coursesArray.value.find(course => course.name === prod.science);
    if (selectedScience) {
        group.value.science = selectedScience;
    } else {
        console.error('Science not found in the dropdown options');
    }

    groupDialog.value = true;
    submitted.value = false;
};

const confirmDeleteGroup = (prod) => {
    group.value = prod;
    deleteGroupDialog.value = true;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const openAddStudentDialog = () => {
    addStudentDialogVisible.value = true;
};

const hideAddStudentDialog = () => {
    addStudentDialogVisible.value = false;
    selectedStudent.value = null;
};

const addStudentToGroup = async () => {
    if (selectedStudent.value) {
        if (!selectedGroup.value.students) {
            selectedGroup.value.students = [];
        }
        selectedGroup.value.students.push(selectedStudent.value);

        try {
            await groupsStore.updateGroup(selectedGroup.value);

            // Update the displayed student list
            selectedGroupStudents.value = selectedGroup.value.students;

            toast.add({ severity: 'success', summary: 'Successful', detail: 'Student Added', life: 3000 });

            // Close the dialog and reset the selected student
            addStudentDialogVisible.value = false;
            selectedStudent.value = null;
        } catch (error) {
            console.error('Error updating group with new student:', error.message);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add student to group', life: 3000 });
        }
    }
};


// New functions for deleting a student from the group
const confirmDeleteStudent = (student) => {
    studentToDelete.value = student;
    deleteStudentDialog.value = true;
};

const deleteStudentFromGroup = async () => {
    selectedGroup.value.students = selectedGroup.value.students.filter(s => s.id !== studentToDelete.value.id);

    try {
        await groupsStore.updateGroup(selectedGroup.value);

        toast.add({ severity: 'success', summary: 'Successful', detail: 'Student Removed', life: 3000 });

        // Update the displayed student list
        selectedGroupStudents.value = selectedGroup.value.students;

        // Close the confirmation dialog
        deleteStudentDialog.value = false;
        studentToDelete.value = null;
    } catch (error) {
        console.error('Error updating group after removing student:', error.message);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove student from group', life: 3000 });
    }
};
</script>

<style>
/* Add any required styles here */
</style>
