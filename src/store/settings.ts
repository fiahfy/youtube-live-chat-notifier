import { Module } from 'vuex'
import { Settings } from '~/models'
import { State as RootState } from '~/store'

export type State = Settings

const initialState: State = {
  types: {
    guest: false,
    member: false,
    moderator: true,
    owner: true,
  },
}

export const module: Module<State, RootState> = {
  namespaced: true,
  state: () => ({ types: { ...initialState.types } }),
  mutations: {
    setTypes(state, { types }: { types: Settings['types'] }) {
      state.types = types
    },
    reset(state) {
      state.types = { ...initialState.types }
    },
  },
}
