import { browser } from 'webextension-polyfill-ts'
import Settings, { AuthorType } from '~/models/settings'
import notifications from '~/assets/notifications.svg'

const ClassName = {
  menuButton: 'ylcn-menu-button',
  activeMenuButton: 'ylcn-active-menu-button',
}

let enabled: boolean
let settings: Settings

const querySelectorAsync = (
  selector: string,
  interval = 100,
  timeout = 1000
): Promise<Element | null> => {
  return new Promise((resolve) => {
    const expireTime = Date.now() + timeout
    const timer = setInterval(() => {
      const e = document.querySelector(selector)
      if (e || Date.now() > expireTime) {
        clearInterval(timer)
        resolve(e)
      }
    }, interval)
  })
}

export const getImageSourceAsync = (
  img: HTMLImageElement,
  interval = 100,
  timeout = 1000
): Promise<string> => {
  return new Promise((resolve) => {
    const expireTime = Date.now() + timeout
    const timer = setInterval(() => {
      if (img.src || Date.now() > expireTime) {
        clearInterval(timer)
        resolve(img.src)
      }
    }, interval)
  })
}

function getDataUrl(img: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }
  ctx.drawImage(img, 0, 0)

  return canvas.toDataURL('image/png')
}

const updateMenuButton = () => {
  const button = document.querySelector(`.${ClassName.menuButton}`)
  if (!button) {
    return
  }
  if (enabled) {
    button.classList.add(ClassName.activeMenuButton)
  } else {
    button.classList.remove(ClassName.activeMenuButton)
  }
}

const addMenuButton = () => {
  const header = document.querySelector(
    '#chat-messages > yt-live-chat-header-renderer'
  )
  const refIconButton = header && header.querySelector('yt-icon-button')
  if (!header || !refIconButton) {
    return
  }

  const icon = document.createElement('yt-icon')
  icon.classList.add('yt-live-chat-header-renderer', 'style-scope')

  const iconButton = document.createElement('yt-icon-button')
  iconButton.id = 'overflow'
  iconButton.classList.add(
    ClassName.menuButton,
    'style-scope',
    'yt-live-chat-header-renderer'
  )
  iconButton.title = 'Notify Messages'
  iconButton.onclick = () => {
    browser.runtime.sendMessage({ id: 'menuButtonClicked' })
  }
  iconButton.append(icon)

  header.insertBefore(iconButton, refIconButton)

  // insert svg after wrapper button appended
  icon.innerHTML = notifications

  updateMenuButton()
}

const notify = async (element: HTMLElement) => {
  if (!enabled) {
    return
  }

  if (element.tagName.toLowerCase() !== 'yt-live-chat-text-message-renderer') {
    return
  }

  const authorType = (element.getAttribute('author-type') ||
    'guest') as AuthorType
  if (!settings.enabledTypes.includes(authorType)) {
    return
  }

  const htmlMessage = element.querySelector('#message')?.innerHTML ?? ''
  const message = htmlMessage
    ?.replace(/<img [^>]*alt="([^"]+)" [^>]*>/g, (_match, p1) => p1)
    .replace(/<[^>]*>/g, '')
  const author = element.querySelector('#author-name')?.textContent ?? ''
  const avatorImage = element.querySelector('#img') as HTMLImageElement | null
  avatorImage && avatorImage.setAttribute('crossOrigin', 'anonymous')
  const avatarUrl =
    (avatorImage && (await getImageSourceAsync(avatorImage))) ?? ''
  const url = await new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = avatarUrl
    img.onload = () => {
      resolve(getDataUrl(img))
    }
  })

  browser.runtime.sendMessage({
    id: 'notifyMessage',
    data: {
      message,
      author,
      avatarUrl: url,
    },
  })
}

const observe = async () => {
  const items = await querySelectorAsync(
    '#items.yt-live-chat-item-list-renderer'
  )
  if (!items) {
    return
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const nodes = Array.from(mutation.addedNodes)
      nodes.forEach((node: Node) => {
        if (node instanceof HTMLElement) {
          notify(node)
        }
      })
    })
  })

  observer.observe(items, { childList: true })
}

browser.runtime.onMessage.addListener((message) => {
  const { id, data } = message
  switch (id) {
    case 'enabledChanged':
      enabled = data.enabled
      updateMenuButton()
      break
    case 'settingsChanged':
      settings = data.settings
      break
    case 'notificationClicked':
      window.parent.focus()
      break
  }
})

document.addEventListener('DOMContentLoaded', async () => {
  const data = await browser.runtime.sendMessage({ id: 'contentLoaded' })
  enabled = data.enabled
  settings = data.settings
  addMenuButton()
  await observe()
})
