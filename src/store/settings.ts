import { Module, VuexModule, Mutation } from 'vuex-module-decorators'
import Settings, { AuthorType } from '~/models/settings'

const initialState: Settings = {
  enabledTypes: ['moderator', 'owner'],
}

@Module({ name: 'settings' })
export default class SettingsModule extends VuexModule {
  enabledTypes = initialState.enabledTypes

  @Mutation
  setenabledTypes({ enabledTypes }: { enabledTypes: AuthorType[] }) {
    this.enabledTypes = enabledTypes
  }
  @Mutation
  reset() {
    for (const [k, v] of Object.entries(initialState)) {
      ;(this as any)[k] = v // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }
}
