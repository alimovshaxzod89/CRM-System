
<template>
    <div>
        <div class="card">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Add Course" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                    <!-- <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedCourses || !selectedCourses.length" /> -->
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)"  />
                </template>
            </Toolbar>

            <DataTable 
                ref="dt" 
                :value="coursesArray" 
                v-model:selection="selectedCourses" 
                dataKey="id"
                :paginator="true" :rows="10" :filters="filters"
                :sortOrder="1" 
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} courses">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Courses</h4>
						<IconField iconPosition="left">
                            <!-- <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon> -->
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
					</div>
                </template>

                <!-- <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column> -->

                <Column header="#" headerStyle="width:3rem">
                    <template #body="slotProps">
                        {{ slotProps.index + 1 }}
                    </template>
                </Column>

                <Column field="name" header="Course Name" sortable style="min-width:12rem"></Column>

                <Column :exportable="false" v-if="!isArRole" style="min-width:3rem;">
                    <template #body="slotProps">
                        <div style="display: flex; justify-content: end;">
                            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCourse(slotProps.data)" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteCourse(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="courseDialog" :style="{width: '450px'}" header="Add Course" :modal="true" class="p-fluid">
            <div class="field">
                <label for="name">Course Name</label>
                <InputText id="name" v-model.trim="course.name" required="true" autofocus :invalid="submitted && !course.name" />
                <small class="p-error" v-if="submitted && !course.name">Name is required.</small>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="saveCourse" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCourseDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="course">Are you sure you want to delete <b>{{course.name}}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteCourseDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deleteCourse" />
            </template>
        </Dialog>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useToast } from 'primevue/usetoast';
import { useCoursesStore } from './CoursesStoreModule'



const toast = useToast();
const dt = ref();
const course = ref({});
const courses = ref([]);
const courseDialog = ref(false);
const deleteCourseDialog = ref(false);
const selectedCourses = ref();
const filters = ref({
    'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);


const coursesStore = useCoursesStore()
const coursesArray = ref([]);

onMounted(() => {
    coursesStore.fetchCourses().then(() => {
        if (typeof coursesStore.courses === 'object' && coursesStore.courses !== null) {
            coursesArray.value = Object.keys(coursesStore.courses).map(key => ({
                id: key,
                ...coursesStore.courses[key]
            }));
        } else {
            console.error("Courses data is not an object:", coursesStore.courses);
        }
    }).catch(error => {
        console.error("Error fetching courses:", error);
    });
});

const isArRole = computed(() => localStorage.getItem('role') === 'ar');

const openNew = () => {
    course.value = {};
    submitted.value = false;
    courseDialog.value = true;
};
const hideDialog = () => {
    courseDialog.value = false;
    submitted.value = false; 
    course.value = {};
};

const saveCourse = async () => {
    submitted.value = true;

    if (course?.value.name?.trim()) {
        try {
            if (course.value.id) {
                await updateCourse();
            } else {
        
                const newCourse = await coursesStore.saveCourse(course.value);

        
                coursesArray.value.push(newCourse);

                toast.add({ severity: 'success', summary: 'Successful', detail: 'Course Created', life: 3000 });

        
                courseDialog.value = false;
        
                course.value = {};
            }
        } catch (error) {
            console.error('Error saving course:', error.message);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save course', life: 3000 });
        }
    }
};


const updateCourse = async () => {
    try {
        await coursesStore.updateCourse(course.value);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Course Updated', life: 3000 });


        const index = coursesArray.value.findIndex(s => s.id === course.value.id);
        if (index !== -1) {
            coursesArray.value[index] = { ...course.value };
        }


        courseDialog.value = false;

        course.value = {};
    } catch (error) {
        console.error('Error updating course:', error.message);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update course', life: 3000 });
    }
};


const deleteCourse = async () => {
    try {
        await coursesStore.deleteCourse(course.value.id);
        

        coursesArray.value = coursesArray.value.filter(s => s.id !== course.value.id);
        

        deleteCourseDialog.value = false;
        

        toast.add({ severity: 'success', summary: 'Successful', detail: 'Course Deleted', life: 3000 });
        

        course.value = {};
    } catch (error) {
        console.error('Error deleting course:', error.message);

        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete course', life: 3000 });
    }
};


const editCourse = (prod) => {
    const index = coursesArray.value.findIndex(s => s.id === prod.id);
    if (index !== -1) {

        coursesArray.value[index] = { ...prod };
    } else {
        console.error('Course not found in the array');
    }
    
    course.value = { ...prod };
    courseDialog.value = true;
    submitted.value = false; 
};


const confirmDeleteCourse = (prod) => {
    course.value = prod;
    deleteCourseDialog.value = true;
};


const exportCSV = () => {
    dt.value.exportCSV();
};
</script>
