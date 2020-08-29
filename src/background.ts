import { browser } from 'webextension-polyfill-ts'
import { nanoid } from 'nanoid'
import { readyStore } from '~/store'
import iconOff from '~/assets/icon-off.png'
import iconOn from '~/assets/icon-on.png'

let initialEnabled = true
let enabledStates: { [tabId: number]: boolean } = {}
let notificationData: {
  [notificationId: string]: { url: string; time: number }
} = {}

const getSettings = async () => {
  const store = await readyStore()
  return JSON.parse(JSON.stringify(store.state.settings))
}

const setIcon = async (tabId: number, enabled: boolean) => {
  const path = enabled ? iconOn : iconOff
  await browser.pageAction.setIcon({ tabId, path })
}

const contentLoaded = async (tabId: number) => {
  const enabled = enabledStates[tabId] ?? initialEnabled
  enabledStates = { ...enabledStates, [tabId]: enabled }

  await setIcon(tabId, enabled)
  await browser.pageAction.show(tabId)

  const settings = await getSettings()

  return { enabled, settings }
}

const menuButtonClicked = async (tabId: number) => {
  let enabled = enabledStates[tabId] ?? initialEnabled
  enabled = !enabled

  initialEnabled = enabled

  enabledStates = { ...enabledStates, [tabId]: enabled }

  await setIcon(tabId, enabled)

  await browser.tabs.sendMessage(tabId, {
    id: 'enabledChanged',
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

  await browser.notifications.create(id, {
    type: 'basic',
    title: author,
    iconUrl: avatarUrl ?? iconOff,
    message,
  })
}

const settingsChanged = async () => {
  const settings = await getSettings()
  const tabs = await browser.tabs.query({})
  for (const tab of tabs) {
    try {
      tab.id &&
        (await browser.tabs.sendMessage(tab.id, {
          id: 'settingsChanged',
          data: { settings },
        }))
    } catch (e) {} // eslint-disable-line no-empty
  }
}

browser.notifications.onClicked.addListener(async (notificationId: string) => {
  try {
    await browser.notifications.clear(notificationId)
    const { url, time } = notificationData[notificationId]
    const tabs = await browser.tabs.query({ url })
    if (tabs.length) {
      const tab = tabs[0]
      await browser.tabs.update(tab.id, { active: true })
      if (tab.windowId) {
        await browser.windows.update(tab.windowId, { focused: true })
      }
    } else {
      await browser.tabs.create({ url: `${url}&t=${time}`, active: true })
    }
  } catch (e) {} // eslint-disable-line no-empty
})

browser.runtime.onMessage.addListener(async (message, sender) => {
  const { id, data } = message
  const { tab } = sender
  switch (id) {
    case 'contentLoaded':
      return tab?.id && (await contentLoaded(tab.id))
    case 'menuButtonClicked':
      tab?.id && (await menuButtonClicked(tab.id))
      break
    case 'notifyMessage':
      await notifyMessage(data)
      break
    case 'settingsChanged':
      await settingsChanged()
      break
  }
})
