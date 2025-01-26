<template>
  <div :class="['my-select', stateClasses]">
    <slot name="header" :label="label">
      <label
        v-if="searchable"
        class="my-select__title"
        :for="`my-select-search-${uuid}`"
      >
        {{ label }}
      </label>

      <div
        v-else
        class="my-select__title"
        :id="`my-select-title-${uuid}`"
      >
        {{ label }}
      </div>
    </slot>

    <!-- aria-labelledby вместо aria-label для того чтобы не было проблем с переводчиками -->
    <div
      :id="`my-select-combobox-${uuid}`"
      ref="toggle"
      class="my-select__selector"
      tabindex="0"
      role="combobox"
      aria-haspopup="listbox"
      aria-owns="my-select-listbox"
      :aria-labelledby="`my-select-title-${uuid}`"
      :aria-expanded="opened"
      @focus="onComboboxFocus"
    >
      <div
        ref="selectedOptions"
        class="my-select__selected-options"
      >
        <div
          v-for="option in selectedValues"
          :key="`selected-option-${uuid}-${option.value}`"
          class="my-select__selected-option"
        >
          <!-- Можем стилизовать выбранную опцию -->
          <slot name="selected-option" :option="option">
            <span class="my-select__selected-option-text">
                {{ option.label }}
            </span>

            <button
              v-if="multiple"
              ref="deselectButtons"
              class="my-select__deselect"
              type="button"
              :disabled="disabled"
              @click="() => deselectOption(option.value)"
            >
              <span class="visually-hidden">Отменить выбор {{ option.label }}</span>
              <img class="my-select__deselect-img" src="/public/close.svg" alt="">
            </button>
          </slot>
        </div>

        <!-- Поиск -->
        <input
          v-if="searchable"
          ref="search"
          class="my-select__search"
          type="text"
          :id="`my-select-search-${uuid}`"
          :value="searchValue"
          :disabled="disabled"
          :placeholder="placeholder"
          aria-autocomplete="list"
          @keydown="onSearchKeyDown"
          @input="onSearchInput"
        />
      </div>

      <slot name="spinner" :loading="loading">
        <span v-if="loading" class="my-select__loader"></span>
      </slot>
    </div>

    <!--  Найденный список -->
    <div v-if="opened" class="my-select__dropdown-menu" tabindex="-1" @focus="onComboboxFocus">
      <ul
        v-if="options.length"
        :id="`my-select-listbox-${uuid}`"
        ref="dropdownMenu"
        class="my-select__dropdown-menu-list"
        role="listbox"
      >
        <li
          v-for="(option, index) in options"
          :key="index"
          :id="`my-select-option--${uuid}-${index}`"
          role="option"
          :class="[
            'my-select__dropdown-option',
            {'my-select__dropdown-option_active' : index === activeOptionIndex}
          ]"
          @click.prevent.stop="() => onOptionClick(option)"
        >
          <slot name="option" :option="option">
            {{ option.label }}
          </slot>
        </li>
      </ul>

      <div v-else class="my-select__dropdown-menu">
        <slot name="options-not-found">
          Ничего не найдено
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

import { createUUID } from '@/utils/uuid.ts';

import type { ISelectValue } from '../types/select';
import { SelectActions } from '../types/select';

interface Props {
  // Текущее выбранное значение
  selectedValues: ISelectValue | ISelectValue[];

  // Список опций для выбора
  options: ISelectValue[];

  // Название селекта
  label: string;

  // Подсказка для селекта
  placeholder: string;

  // Вывести ошибку
  error: any;

  // Отобразить состояние ожидания данных
  loading: boolean;

  // Разрешает поиск по списку опций
  searchable: boolean;

  // Разрешить множественный выбор
  multiple?: boolean;

  // Максимально разрешенное кол-во выбранных элементов при множественном выборе
  maxSelectedOptionsCount?: number;

  // Заблокировать селект
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  disabled: false,
  searchable: false,
  maxSelectedOptionsCount: 3,
});

const emits = defineEmits(['select', 'deselect', 'search']);

const search = ref<HTMLInputElement | null>(null);
const opened = ref<boolean>(false);
const searchValue = ref<string>('');
const activeOptionIndex = ref<number>(-1);

const stateClasses = computed(() => {
  return {
    'my-select_open': opened.value,

    'my-select_single': !props.multiple,
    'my-select_multiple': props.multiple,

    'my-select_unsearchable': !props.searchable,
    'my-select_searchable': props.searchable,

    'my-select_loading': props.loading,
    'my-select_disabled': props.disabled,
  };
});

const uuid = createUUID();

const onSearchInput = (event: InputEvent) => {
  opened.value = Boolean(event.target.value);
  searchValue.value = event.target.value;

  emits('search', event.target.value);
};

const deselectOption = (value: string) => {
  emits('deselect', value);
};

const onComboboxFocus = () => {
  if (props.searchable && search.value) {
    return search.value.focus();
  }
};

const onSearchKeyDown = (event: KeyboardEvent) => {
  const max = props.options.length - 1;

  const action = getSelectActionFromKey(event);

  switch (action) {
    case SelectActions.LAST:
    case SelectActions.FIRST:
      return updateMenuState(true);
    case SelectActions.NEXT:
    case SelectActions.PREVIOUS:
    case SelectActions.PAGE_UP:
    case SelectActions.PAGE_DOWN:
      event.preventDefault();
      return onOptionChange(getUpdatedIndex(activeOptionIndex.value, max, action));
    case SelectActions.CLOSE_SELECT:
      event.preventDefault();
      return selectOption(activeOptionIndex.value);
    case SelectActions.CLOSE:
      event.preventDefault();
      return updateMenuState(false);
    case SelectActions.OPEN:
      event.preventDefault();
      return updateMenuState(true);
  }
};

const getUpdatedIndex = (currentIndex: number, maxIndex: number, action: SelectActions) => {
  // TODO - вынести в конфиги далее
  const pageSize = 4;

  switch (action) {
    case SelectActions.FIRST:
      return 0;
    case SelectActions.LAST:
      return maxIndex;
    case SelectActions.PREVIOUS:
      return Math.max(0, currentIndex - 1);
    case SelectActions.NEXT:
      return Math.min(maxIndex, currentIndex + 1);
    case SelectActions.PAGE_UP:
      return Math.max(0, currentIndex - pageSize);
    case SelectActions.PAGE_DOWN:
      return Math.min(maxIndex, currentIndex + pageSize);
    default:
      return currentIndex;
  }
};

const selectOption = (index: number) => {
  activeOptionIndex.value = index;
  onOptionClick(props.options[index]);
};

const getSelectActionFromKey = (event: KeyboardEvent) => {
  const { key, altKey, ctrlKey, metaKey } = event;

  // Клавиши которые открывают меню
  const openKeys = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

  if (!opened.value && openKeys.includes(key)) {
    return SelectActions.OPEN;
  }

  if (key === 'Home') {
    return SelectActions.FIRST;
  }

  if (key === 'End') {
    return SelectActions.LAST;
  }

  if (
    key === 'Backspace' ||
    key === 'Clear' ||
    (key.length === 1 && key !== ' ' && !altKey && !ctrlKey && !metaKey)
  ) {
    return SelectActions.TYPE;
  }

  if (opened.value) {
    if (key === 'ArrowUp' && altKey) {
      return SelectActions.CLOSE_SELECT;
    } else if (key === 'ArrowDown' && !altKey) {
      return SelectActions.NEXT;
    } else if (key === 'ArrowUp') {
      return SelectActions.PREVIOUS;
    } else if (key === 'PageUp') {
      return SelectActions.PAGE_UP;
    } else if (key === 'PageDown') {
      return SelectActions.PAGE_DOWN;
    } else if (key === 'Escape') {
      return SelectActions.CLOSE;
    } else if (key === 'Enter' || key === ' ') {
      return SelectActions.CLOSE_SELECT;
    }
  }
};

const updateMenuState = (open: boolean, callFocus = true) => {
  if (opened.value === open) {
    return;
  }

  opened.value = open;
};

const onOptionChange = (index: number) => {
  activeOptionIndex.value = index;
  // TODO - доработать подскролл чтобы было видно елемент вне области видимости
};

const onOptionClick = (option: ISelectValue) => {
  if (Array.isArray(props.selectedValues) && props.selectedValues.length >= props.maxSelectedOptionsCount) {
    // TODO - можно вывести нотификацию о том что пользователь выбрал максимально доступное кол-во тегов
    return;
  }

  emits('select', option);
};

const clickOutside = (event: PointerEvent) => {
  if (!event.target.closest('.my-select')) {
    updateMenuState(false);
  }
};

onMounted(() => {
  document.addEventListener('click', clickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', clickOutside);
});
</script>

<style scoped>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.my-select {
  position: relative;
  width: 100%;
}

.my-select_open .my-select__selector {
  outline: 2px solid blue;
}

.my-select__selector {
  display: flex;
  flex-wrap: wrap;

  width: 100%;
  padding: 4px;

  background: white;

  border: 1px solid gray;
  border-radius: 4px;
}

.my-select__dropdown-menu-list {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;

  display: flex;
  flex-direction: column;
  gap: 4px;

  /* Высота 4 карточек по 56px + 4 отступа по 4px между элементами */
  max-height: 240px;
  overflow-x: auto;

  padding: 0;
  margin: 0;

  box-shadow: 4px 4px 8px 0 rgb(53, 87, 114);
  border-radius: 4px;
  color: black;
  background: white;
}

.my-select__dropdown-option {
  padding: 8px 4px;
}

.my-select__dropdown-option:hover {
  cursor: pointer;
  background-color: rgb(192, 198, 204);
}

.my-select__dropdown-option_active {
  background-color: rgb(192, 198, 204);
}

.my-select__loader {
  margin-inline-start: auto;

  width: 24px;
  height: 24px;

  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.my-select__selected-options {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.my-select__selected-option {
  display: inline-flex;
  gap: 4px;
  padding: 2px;
  border: 1px solid #9acff3;
  background-color: #9acff3;
  border-radius: 4px;
}

.my-select__selected-option-text {
  max-width: 120px;
  color: black;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.my-select__search {
  flex-shrink: 1;
  margin: 0;
  padding: 0;

  background: transparent;

  border: none;
  appearance: none;
  outline: none;
}

.my-select__deselect {
  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  background: transparent;
  color: white;
  font-size: 20px;
}

.my-select__deselect-img {
  width: 16px;
  height: 16px;
}
</style>