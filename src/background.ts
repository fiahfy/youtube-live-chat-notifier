import { nanoid } from 'nanoid'
import { Settings } from '~/models'
import { persistConfig } from '~/store'
import { initialState as initialSettings } from '~/store/settings'
import icon from '/icon.png'
import iconOn from '/icon-on.png'

let initialEnabled = true
let enabledStates: { [tabId: number]: boolean } = {}
let notificationData: {
  [notificationId: string]: { url: string; time: number }
} = {}

const getSettings = async () => {
  try {
    const key = `persist:${persistConfig.key}`
    const json = (await chrome.storage.local.get(key))[key]
    const rootState = JSON.parse(json)
    return JSON.parse(rootState.settings)
  } catch (e) {
    return initialSettings
  }
}

const setIcon = async (tabId: number, enabled: boolean) => {
  const path = enabled ? iconOn : icon
  await chrome.action.setIcon({ tabId, path })
}

const contentLoaded = async (tabId: number) => {
  const enabled = enabledStates[tabId] ?? initialEnabled
  enabledStates = { ...enabledStates, [tabId]: enabled }

  await setIcon(tabId, enabled)

  const settings = await getSettings()

  return { enabled, settings }
}

const menuButtonClicked = async (tabId: number) => {
  let enabled = enabledStates[tabId] ?? initialEnabled
  enabled = !enabled

  initialEnabled = enabled

  enabledStates = { ...enabledStates, [tabId]: enabled }

  await setIcon(tabId, enabled)

  await chrome.tabs.sendMessage(tabId, {
    type: 'enabled-changed',
    data: { enabled },
  })
}

const notifyMessage = async ({
  message,
  author,
  avatarUrl,
  url,
  time,
}: {
  message: string
  author: string
  avatarUrl: string
  url: string
  time: number
}) => {
  const id = nanoid()
  notificationData = { ...notificationData, [id]: { url, time } }

  await chrome.notifications.create(id, {
    type: 'basic',
    title: author,
    iconUrl: avatarUrl ?? icon,
    message,
  })
}

const settingsChanged = async (settings: Settings) => {
  const tabs = await chrome.tabs.query({
    url: 'https://www.youtube.com/*',
  })
  for (const tab of tabs) {
    try {
      tab.id &&
        chrome.tabs.sendMessage(tab.id, {
          type: 'settings-changed',
          data: { settings },
        })
    } catch (e) {} // eslint-disable-line no-empty
  }
}

chrome.notifications.onClicked.addListener(async (notificationId: string) => {
  try {
    await chrome.notifications.clear(notificationId)
    const { url, time } = notificationData[notificationId]
    const tabs = await chrome.tabs.query({ url })
    if (tabs.length) {
      const tab = tabs[0]
      tab.id && (await chrome.tabs.update(tab.id, { active: true }))
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true })
      }
    } else {
      await chrome.tabs.create({ url: `${url}&t=${time}`, active: true })
    }
  } catch (e) {} // eslint-disable-line no-empty
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, data } = message
  const { tab } = sender
  switch (type) {
    case 'content-loaded':
      if (tab?.id) {
        contentLoaded(tab.id).then((data) => sendResponse(data))
        return true
      }
      return
    case 'menu-button-clicked':
      if (tab?.id) {
        menuButtonClicked(tab.id).then(() => sendResponse())
        return true
      }
      return
    case 'notify-message':
      notifyMessage(data).then(() => sendResponse())
      return true
    case 'settings-changed':
      settingsChanged(data.settings).then(() => sendResponse())
      return true
  }
})
