import { Settings } from '~/models'
import notifications from '~/assets/notifications.svg'

const ClassName = {
  menuButton: 'ylcn-menu-button',
  activeMenuButton: 'ylcn-active-menu-button',
  filterActivated: 'ylcfr-active',
  filteredMessage: 'ylcfr-filtered-message',
  deletedMessage: 'ylcfr-deleted-message',
}

let enabled: boolean
let settings: Settings

const querySelectorAsync = (
  selector: string,
  interval = 100,
  timeout = 10000
) => {
  return new Promise<Element | null>((resolve) => {
    const expireTime = Date.now() + timeout
    const timer = window.setInterval(() => {
      const e = document.querySelector(selector)
      if (e || Date.now() > expireTime) {
        clearInterval(timer)
        resolve(e)
      }
    }, interval)
  })
}

const getImageSourceAsync = (
  img: HTMLImageElement,
  interval = 100,
  timeout = 10000
) => {
  return new Promise<string>((resolve) => {
    const expireTime = Date.now() + timeout
    const timer = window.setInterval(() => {
      if (img.src || Date.now() > expireTime) {
        clearInterval(timer)
        resolve(img.src)
      }
    }, interval)
  })
}

const getResizedImageUrl = (url: string) => {
  return url.replace(/(=s)\d+/, '$1128')
}

const getDataUrlFromImg = (img: HTMLImageElement) => {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return undefined
  }
  ctx.drawImage(img, 0, 0)

  return canvas.toDataURL('image/jpeg')
}

const getDataUrl = (url: string) => {
  return new Promise<string | undefined>((resolve) => {
    if (!url) {
      return resolve(url)
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    img.onload = () => {
      resolve(getDataUrlFromImg(img))
    }
  })
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

const addMenuButton = async () => {
  const header = await querySelectorAsync(
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
  iconButton.onclick = async () => {
    await chrome.runtime.sendMessage({ type: 'menu-button-clicked' })
  }
  iconButton.append(icon)

  header.insertBefore(iconButton, refIconButton)

  // insert svg after wrapper button appended
  icon.innerHTML = notifications

  updateMenuButton()
}

const validateDeletedMessage = async (element: HTMLElement) => {
  const active = document.documentElement.classList.contains(
    ClassName.filterActivated
  )
  if (!active) {
    return false
  }
  const deleted = await new Promise<boolean>((resolve) => {
    const expireTime = Date.now() + 1000
    const timer = window.setInterval(() => {
      const filtered = element.classList.contains(ClassName.filteredMessage)
      if (filtered || Date.now() > expireTime) {
        clearInterval(timer)
        const deleted = element.classList.contains(ClassName.deletedMessage)
        resolve(deleted)
      }
    }, 10)
  })
  return deleted
}

const notify = async (element: HTMLElement) => {
  if (!enabled) {
    return
  }

  const video = parent.document.querySelector(
    'ytd-watch-flexy video.html5-main-video'
  ) as HTMLVideoElement | null
  if (!video || video.paused) {
    return
  }

  const deleted = await validateDeletedMessage(element)
  if (deleted) {
    return
  }

  if (element.tagName.toLowerCase() !== 'yt-live-chat-text-message-renderer') {
    return
  }

  const authorType = (element.getAttribute('author-type') ||
    'guest') as keyof Settings['types']
  if (!settings.types[authorType]) {
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
  const resizedUrl = getResizedImageUrl(avatarUrl)
  const dataUrl = await getDataUrl(resizedUrl)
  const url = parent.location.href
  const time = Math.floor(video.currentTime)

  await chrome.runtime.sendMessage({
    type: 'notify-message',
    data: {
      message,
      author,
      avatarUrl: dataUrl,
      url,
      time,
    },
  })
}

const observe = async () => {
  let messageObserver: MutationObserver | undefined = undefined

  const observeMessages = async () => {
    messageObserver?.disconnect()

    const el = await querySelectorAsync(
      '#items.yt-live-chat-item-list-renderer'
    )
    if (!el) {
      return
    }

    messageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const nodes = Array.from(mutation.addedNodes)
        nodes.forEach((node: Node) => {
          if (node instanceof HTMLElement) {
            notify(node)
          }
        })
      })
    })
    messageObserver.observe(el, { childList: true })
  }

  await observeMessages()

  const el = await querySelectorAsync('#item-list.yt-live-chat-renderer')
  if (!el) {
    return
  }

  const observer = new MutationObserver(async () => {
    await observeMessages()
  })
  observer.observe(el, { childList: true })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type, data } = message
  switch (type) {
    case 'enabled-changed':
      enabled = data.enabled
      updateMenuButton()
      return sendResponse()
    case 'settings-changed':
      settings = data.settings
      return sendResponse()
  }
})

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.runtime.sendMessage({ type: 'content-loaded' })
  enabled = data.enabled
  settings = data.settings
  await addMenuButton()
  await observe()
})
