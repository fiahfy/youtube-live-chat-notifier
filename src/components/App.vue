<script setup lang="ts">
import { computed } from 'vue'
import { Settings } from '~/models'
import { useStore } from '~/store'

const store = useStore()

const enabledTypes = computed({
  get: () =>
    (
      Object.keys(store.state.settings.types) as (keyof Settings['types'])[]
    ).filter((type) => store.state.settings.types[type]),
  set: (value) => {
    const types = (
      Object.keys(store.state.settings.types) as (keyof Settings['types'])[]
    ).reduce((carry, type) => {
      return {
        ...carry,
        [type]: value.includes(type),
      }
    }, {} as Settings['types'])
    store.commit('settings/setTypes', { types })
  },
})

const handleClick = () =>
  window.open(
    'https://chrome.google.com/webstore/detail/chat-filter-for-youtube-l/jalcplhakmckbmlbidmbmpaegcpbejog'
  )

const handleClickReset = () => store.commit('settings/reset')
</script>

<template>
  <v-app>
    <v-main class="fill-height">
      <v-container fluid>
        <v-switch
          v-model="enabledTypes"
          color="primary"
          density="compact"
          hide-details
          label="Guest"
          value="guest"
        />
        <v-switch
          v-model="enabledTypes"
          color="primary"
          density="compact"
          hide-details
          label="Member"
          value="member"
        />
        <v-switch
          v-model="enabledTypes"
          color="primary"
          density="compact"
          hide-details
          label="Moderator"
          value="moderator"
        />
        <v-switch
          v-model="enabledTypes"
          color="primary"
          density="compact"
          hide-details
          label="Owner"
          value="owner"
        />
        <div class="my-3">
          Filter Notifications by
          <a href="#" @click="handleClick">Chat Filter for YouTube Live</a>
        </div>
        <v-btn
          block
          size="small"
          variant="contained-text"
          @click="handleClickReset"
        >
          Reset
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>

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
