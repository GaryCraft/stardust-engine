import { renderToWebStream } from 'vue/server-renderer'
import { createApp } from './main'

export function render() {
  const { app } = createApp()
  const ctx = {}
  const stream = renderToWebStream(app, ctx)

  return { stream }
}
