import { Module, VuexModule, Mutation } from 'vuex-module-decorators'
import Settings, { Types } from '~/models/settings'

const initialState: Settings = {
  types: {
    guest: false,
    member: false,
    moderator: true,
    owner: true,
  },
}

@Module({ name: 'settings' })
export default class SettingsModule extends VuexModule {
  types = initialState.types

  @Mutation
  setTypes({ types }: { types: Types }) {
    this.types = types
  }
  @Mutation
  reset() {
    for (const [k, v] of Object.entries(initialState)) {
      ;(this as any)[k] = v // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }
}
