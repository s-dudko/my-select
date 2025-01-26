<template>
  <main>
    <my-select
      class="main-select"
      :selectedValues="selectedValues"
      :options="options"
      :label="'Пользователь или компания'"
      :loading="loading"
      :error="error"
      :max-selected-options-count="maxSelectedOptionsCount"
      placeholder="Введите название"
      multiple
      searchable
      @search="onSearch"
      @select="onSelect"
      @deselect="onDeselect"
    >
      <template #option="{ option }">
        <publication-info :option="option"/>
      </template>
    </my-select>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { IPublicationInfo } from './types/publication';
import type { ISelectValue } from './types/select';
import { debounce } from './utils/debounce';

import MySelect from './components/my-select.vue';
import PublicationInfo from './components/publication-info.vue';

// Можно будет вынести в конфиги
const API_BASE: string = 'https://habr.com/kek/v2/publication/suggest-mention';
const minSearchQueryLength: number = 3;
const maxSelectedOptionsCount: number = 1;

// Выбранные опции, с которыми затем можно взаимодействовать
const selectedValues = ref<ISelectValue[]>([]);

const options = ref<ISelectValue[]>([]);
const loading = ref<boolean>(false);
const error = ref<boolean>(false);

const onSearch = (query: string) => {
  debounce(search.bind(null, query), 300)();
};

const search = async (query: string) => {
  if (query.length < minSearchQueryLength) {
    options.value = [];
    return;
  }

  try {
    loading.value = true;

    const url = `${API_BASE}?q=${query}`;

    const response = await fetch(url);
    const { data } = await response.json();

    options.value = data
    // Не включать в опции то что уже выбрано
    .filter((publication: IPublicationInfo) => {
      return !selectedValues.value.some((option: ISelectValue) => option.value === publication.alias);
    })
    // Задам label и value как дефолтные параметры для селекта
    // в качестве value использую alias - так как выглдяит так что он уникальный
    // но хотелось бы конечно какой-то айди/ску
    .map((publication: IPublicationInfo) => {
      return {
        label: `@${publication.alias}`,
        value: publication.alias,
        ...publication,
      };
    });
  } catch (err: unknown) {
    console.log('Ошибка получения данных от АПИ: ', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const onSelect = (option: ISelectValue) => {
  options.value = options.value.filter((currentOption) => currentOption.value !== option.value);
  selectedValues.value.push(option as ISelectValue);
};

const onDeselect = (value: string) => {
  selectedValues.value = selectedValues.value.filter((option) => option.value !== value);
};
</script>

<style scoped>
.main-select {
  width: 600px;
}
</style>
