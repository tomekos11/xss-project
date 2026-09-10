<template>

  <div>

    <h3>Kontroluj zabezpieczenia backendu aplikacji</h3>



    <div v-for="option in generalOptions" :key="option.id">

      <q-toggle

        v-model="option.isActive"

        :true-value="1"

        :false-value="0"

        :label="option.name"

        :disable="loading"

      />

      <div v-if="option.description" class="text-caption text-grey-7 q-ml-lg q-mb-md">

        {{ option.description }}

      </div>

    </div>



    <q-separator class="q-my-lg" />



    <h4 class="q-mb-sm">Path Traversal</h4>

    <p class="text-caption text-grey-7 q-mb-md">

      Włącz jeden wariant walidacji ścieżki albo zostaw wszystkie wyłączone, aby przetestować podatną aplikację.

      Blokada nadpisywania działa niezależnie od wybranego wariantu.

    </p>



    <div v-for="option in pathTraversalValidationOptions" :key="option.id">

      <q-toggle

        v-model="option.isActive"

        :true-value="1"

        :false-value="0"

        :label="formatPathTraversalLabel(option.name)"

        :disable="loading"

        @update:model-value="(value) => handlePathTraversalValidationToggle(option.name, value)"

      />

      <div v-if="option.description" class="text-caption text-grey-7 q-ml-lg q-mb-md">

        {{ option.description }}

      </div>

    </div>



    <div v-for="option in pathTraversalExtraOptions" :key="option.id">

      <q-toggle

        v-model="option.isActive"

        :true-value="1"

        :false-value="0"

        :label="formatPathTraversalLabel(option.name)"

        :disable="loading"

      />

      <div v-if="option.description" class="text-caption text-grey-7 q-ml-lg q-mb-md">

        {{ option.description }}

      </div>

    </div>

  </div>

</template>



<script setup lang="ts">

import { useDebounceFn } from '@vueuse/core';

import { Notify } from 'quasar';

import { api } from 'src/boot/axios';

import axios from 'axios';

import { computed, nextTick, onMounted, ref, watch } from 'vue';



interface Options {

  id: number;

  name: string;

  isActive: 0 | 1;

  description?: string;

}



const PATH_TRAVERSAL_VALIDATION_MODES = [

  'path-traversal-normalize',

  'path-traversal-resolve',

  'path-traversal-whitelist',

  'path-traversal-blacklist',

  'path-traversal-realpath',

] as const;



const options = ref<Options[]>([]);

const isFetched = ref(false);

const loading = ref(false);



const generalOptions = computed(() =>

  options.value.filter((option) => !option.name.startsWith('path-traversal')),

);



const pathTraversalValidationOptions = computed(() =>

  options.value.filter((option) =>

    PATH_TRAVERSAL_VALIDATION_MODES.includes(option.name as typeof PATH_TRAVERSAL_VALIDATION_MODES[number]),

  ),

);



const pathTraversalExtraOptions = computed(() =>

  options.value.filter((option) => option.name === 'path-traversal-block-overwrite'),

);



const formatPathTraversalLabel = (name: string) => name.replace('path-traversal-', '');



const handlePathTraversalValidationToggle = (

  changedName: string,

  value: 0 | 1,

) => {

  if (value !== 1) return;



  for (const mode of PATH_TRAVERSAL_VALIDATION_MODES) {

    if (mode === changedName) continue;



    const option = options.value.find((item) => item.name === mode);

    if (option) {

      option.isActive = 0;

    }

  }

};



onMounted(async () => {

  try {

    const { data } = await api.get<Options[]>('/security');



    options.value = data;



    await nextTick();



    isFetched.value = true;

  } catch (err) {

    console.error(err)

  }

})



const saveSecurityOptions = useDebounceFn(async (oldOptions: Options[]) => {

  try {

    loading.value = true



    const { data } = await api.post<Options[]>('/security', {

      securityOptions: options.value

    })



    const securitySettings = [

      { name: 'x-frame-options', endpoint: '/api/set-x-frame-options' },

      { name: 'csp-frame-ancestors', endpoint: '/api/set-csp-frame-ancestors' },

      { name: 'csp-connect-src', endpoint: '/api/set-xss' },

      { name: 'csp-script-src', endpoint: '/api/set-csp-script-src' },

    ]



    for (const { name, endpoint } of securitySettings) {

      const newSetting = options.value.find(el => el.name === name)

      const oldSetting = oldOptions.find(el => el.name === name)



      if (newSetting?.isActive !== oldSetting?.isActive) {

        await axios.post(endpoint, {

          isActive: newSetting?.isActive

        })

      }

    }



    if (JSON.stringify(options.value) !== JSON.stringify(data)) {

      options.value = data

    }



    Notify.create({

      message: 'Zaktualizowano ustawienia bezpieczeństwa',

      type: 'positive'

    })

  } catch (error) {

    console.error('Błąd aktualizacji:', error)

    Notify.create({

      message: 'Błąd podczas zapisywania ustawień',

      type: 'negative'

    })

  } finally {

    loading.value = false

  }

}, 700)



const optionToWatch = computed(() => JSON.parse(JSON.stringify(options.value)));



watch(optionToWatch, async (newVal, oldVal) => {

  if (!isFetched.value) return;



  await saveSecurityOptions(oldVal);



})







</script>

