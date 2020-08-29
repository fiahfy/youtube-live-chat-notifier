import { browser } from 'webextension-polyfill-ts'
import { nanoid } from 'nanoid'
import { readyStore } from '~/store'
import iconOff from '~/assets/icon-off.png'
import iconOn from '~/assets/icon-on.png'

let initialEnabled = true
let enabledStates: { [tabId: number]: boolean } = {}
let tabUrls: { [notificationId: string]: string } = {}

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
  tabUrl,
}: {
  message: string
  author: string
  avatarUrl: string
  tabUrl: string
}) => {
  const id = nanoid()
  tabUrls = { ...tabUrls, [id]: tabUrl }

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
  const tabUrl = tabUrls[notificationId]
  const tabs = await browser.tabs.query({ url: tabUrl })
  if (tabs.length) {
    const tab = tabs[0]
    await browser.tabs.update(tab.id, { active: true })
    if (tab.windowId) {
      await browser.windows.update(tab.windowId, { focused: true })
    }
  } else {
    await browser.tabs.create({ url: tabUrl, active: true })
  }
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
