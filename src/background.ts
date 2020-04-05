import { browser } from 'webextension-polyfill-ts'
import { nanoid } from 'nanoid'
import { readyStore } from '~/store'
import iconOff from '~/assets/icon-off.png'
import iconOn from '~/assets/icon-on.png'
import inject from '~/assets/inject.css'

let initialEnabled = true
let enabledStates: { [tabId: number]: boolean } = {}
let tabIds: { [notificationId: string]: number } = {}

const getSettings = async () => {
  const store = await readyStore()
  return JSON.parse(JSON.stringify(store.state.settings))
}

const setIcon = async (tabId: number, enabled: boolean) => {
  const path = enabled ? iconOn : iconOff
  await browser.pageAction.setIcon({ tabId, path })
}

const contentLoaded = async (tabId: number, frameId: number) => {
  const enabled = enabledStates[tabId] ?? initialEnabled
  enabledStates = { ...enabledStates, [tabId]: enabled }

  await setIcon(tabId, enabled)
  await browser.pageAction.show(tabId)
  await browser.tabs.insertCSS(tabId, { frameId, file: inject })

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

const notifyMessage = async (
  tabId: number,
  {
    message,
    author,
    avatarUrl,
  }: {
    message: string
    author: string
    avatarUrl: string
  }
) => {
  const id = nanoid()
  tabIds = { ...tabIds, [id]: tabId }
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
  await browser.notifications.clear(notificationId)
  const tabId = tabIds[notificationId]
  await browser.tabs.sendMessage(tabId, {
    id: 'notificationClicked',
  })
})

browser.runtime.onMessage.addListener(async (message, sender) => {
  const { id, data } = message
  const { tab, frameId } = sender
  switch (id) {
    case 'contentLoaded':
      return tab?.id && frameId && (await contentLoaded(tab.id, frameId))
    case 'menuButtonClicked':
      tab?.id && (await menuButtonClicked(tab.id))
      break
    case 'notifyMessage':
      tab?.id && (await notifyMessage(tab.id, data))
      break
    case 'settingsChanged':
      await settingsChanged()
      break
  }
})
