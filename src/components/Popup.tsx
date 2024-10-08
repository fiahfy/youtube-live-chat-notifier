import {
  Box,
  Button,
  CssBaseline,
  FormControlLabel,
  FormGroup,
  GlobalStyles,
  Switch,
  Typography,
} from '@mui/material'
import type { ChangeEvent } from 'react'
import StoreProvider from '~/providers/StoreProvider'
import { useAppDispatch, useAppSelector } from '~/store'
import { reset, selectTypes, setTypes } from '~/store/settings'

const App = () => {
  const types = useAppSelector(selectTypes)
  const dispatch = useAppDispatch()

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = e.currentTarget
    dispatch(setTypes({ ...types, [value]: checked }))
  }

  const handleClickLink = () =>
    window.open(
      'https://chrome.google.com/webstore/detail/chat-filter-for-youtube-l/jalcplhakmckbmlbidmbmpaegcpbejog',
    )

  const handleClickReset = () => dispatch(reset())

  return (
    <Box sx={{ m: 1 }}>
      <FormGroup sx={{ mx: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={types.guest}
              onChange={handleChange}
              value="guest"
            />
          }
          label="Guest"
        />
        <FormControlLabel
          control={
            <Switch
              checked={types.member}
              onChange={handleChange}
              value="member"
            />
          }
          label="Member"
        />
        <FormControlLabel
          control={
            <Switch
              checked={types.moderator}
              onChange={handleChange}
              value="moderator"
            />
          }
          label="Moderator"
        />
        <FormControlLabel
          control={
            <Switch
              checked={types.owner}
              onChange={handleChange}
              value="owner"
            />
          }
          label="Owner"
        />
      </FormGroup>
      <Typography paragraph sx={{ m: 1 }} variant="caption">
        Filter Notifications by&nbsp;
        {/* biome-ignore lint/a11y/useValidAnchor: <explanation> */}
        <a href="#" onClick={handleClickLink}>
          Chat Filter for YouTube Live
        </a>
      </Typography>
      <Button fullWidth onClick={handleClickReset} size="small">
        Reset
      </Button>
    </Box>
  )
}

const Popup = () => {
  return (
    <StoreProvider>
      <CssBaseline />
      <GlobalStyles
        styles={{
          html: { overflowY: 'hidden', width: 330 },
        }}
      />
      <App />
    </StoreProvider>
  )
}

export default Popup
