<template>
    <div class="publication-info">
        <div class="publication-info__avatar">
            <!-- alt не проставляю так как картинка выглядит как декоративная -->
            <img 
                v-if="option.avatar"
                class="'publication-info__img'"
                :src="option.avatar" 
                alt=""
            >
            <img 
                v-if="!option.avatar"
                class="publication-info__img publication-info__img_placeholder"
                :src="imagePlaceholderSrc" 
                alt=""
            >
        </div>

        <div class="publication-info__content">
            <div class="publication-info__name">
                {{ name }}
            </div>

            <div v-if="isUser" class="publication-info__alias">
                {{ alias }}
            </div>
            <div v-else class="publication-info__type">
                Компания
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { PublicationInfo, PublicationInfoType } from '../types/publication';

interface Props {
    option: PublicationInfo;
}

const props = defineProps<Props>();

const isUser = props.option.type === PublicationInfoType.USER;

const imagePlaceholderSrc = isUser 
    ? '/public/user-placeholder.svg'
    : '/public/company-placeholder.svg'

const name = props.option.name || props.option.alias;
const alias = `@${props.option.alias}`;
</script>

<style scoped>
.publication-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.publication-info__avatar {
    width: 40px;
    height: 40px;
}

.publication-info__content {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    line-height: 1;
}
.publication-info__name {
    font-weight: 700;
    margin-bottom: 2px;
}

.publication-info__name,
.publication-info__alias {
    width: 200px;

    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.publication-info__alias,
.publication-info__type {
    color: gray;
}
</style>