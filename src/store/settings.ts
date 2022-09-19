import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit'
import { Settings } from '~/models'
import { AppState } from '~/store'

type State = Settings

export const initialState: State = {
  types: {
    guest: false,
    member: false,
    moderator: true,
    owner: true,
  },
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTypes(state, action: PayloadAction<Settings['types']>) {
      return { ...state, types: action.payload }
    },
    reset(state) {
      return { ...state, types: initialState.types }
    },
  },
})

export const { setTypes, reset } = settingsSlice.actions

export default settingsSlice.reducer

export const selectSettings = (state: AppState) => state.settings

export const selectTypes = createSelector(
  selectSettings,
  (settings) => settings.types
)
