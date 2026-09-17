<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'

const categoryStore = useCategoryStore()

onMounted(() => {
  categoryStore.init()
})
</script>
