<template>
  <v-app>
    <v-main class="fill-height">
      <v-container fluid>
        <div class="d-flex">
          <div>
            <v-switch
              v-model="enabledTypes"
              label="Guest"
              value="guest"
              dense
              class="mt-0"
            />
            <v-switch
              v-model="enabledTypes"
              label="Member"
              value="member"
              dense
              class="mt-0"
            />
            <v-switch
              v-model="enabledTypes"
              label="Moderator"
              value="moderator"
              dense
              class="mt-0"
            />
            <v-switch
              v-model="enabledTypes"
              label="Owner"
              value="owner"
              dense
              class="mt-0"
            />
          </div>
        </div>
        <div class="mb-3">
          Filter Notifications by
          <a href="#" @click="handleClick">Chat Filter for YouTube Live</a>
        </div>
        <v-btn depressed small block @click="handleClickReset">Reset</v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api'
import { AuthorType, Types } from '~/models'
import { settingsStore } from '~/store'

export default defineComponent({
  setup() {
    const enabledTypes = computed({
      get: () => {
        return Object.keys(settingsStore.types).filter(
          (type) => settingsStore.types[type as AuthorType]
        )
      },
      set: (value) => {
        const types = Object.keys(settingsStore.types).reduce((carry, type) => {
          return {
            ...carry,
            [type]: value.includes(type),
          }
        }, {} as Types)
        settingsStore.setTypes({ types })
      },
    })

    const handleClick = () => {
      window.open(
        'https://chrome.google.com/webstore/detail/chat-filter-for-youtube-l/jalcplhakmckbmlbidmbmpaegcpbejog'
      )
    }
    const handleClickReset = () => {
      settingsStore.reset()
    }

    return {
      enabledTypes,
      handleClick,
      handleClickReset,
    }
  },
})
</script>

<style lang="scss">
html {
  overflow-y: hidden;
}
</style>

<style lang="scss" scoped>
.v-application {
  min-width: 320px;
}
</style>
