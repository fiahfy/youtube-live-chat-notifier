<template>
  <v-app>
    <v-content class="fill-height">
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
          <a href="#" @click="onClick">
            Chat Filter for YouTube Live
          </a>
        </div>
        <v-btn depressed small block @click="onClickReset">
          Reset
        </v-btn>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { AuthorType, Types } from '~/models/settings'
import { settingsStore } from '~/store'

@Component
export default class Popup extends Vue {
  get enabledTypes() {
    return Object.keys(settingsStore.types).filter(
      (type) => settingsStore.types[type as AuthorType]
    )
  }
  set enabledTypes(value) {
    const types = Object.keys(settingsStore.types).reduce((carry, type) => {
      return {
        ...carry,
        [type]: value.includes(type),
      }
    }, {} as Types)
    settingsStore.setTypes({ types })
  }

  onClick() {
    window.open(
      'https://chrome.google.com/webstore/detail/chat-filter-for-youtube-l/jalcplhakmckbmlbidmbmpaegcpbejog'
    )
  }
  onClickReset() {
    settingsStore.reset()
  }
}
</script>

<style lang="scss">
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}
html {
  overflow-y: hidden;
}
</style>

<style lang="scss" scoped>
.v-application {
  min-width: 320px;
  .v-content ::v-deep .v-content__wrap {
    overflow-y: auto;
  }
}
</style>
