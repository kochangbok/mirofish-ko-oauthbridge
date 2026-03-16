import { findNextQueuedRequest, processRequest } from '../lib/worker.js'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const once = process.argv.includes('--once')
const specificIndex = process.argv.indexOf('--request-id')
const specificRequestId = specificIndex >= 0 ? process.argv[specificIndex + 1] : null

async function main() {
  if (specificRequestId) {
    await processRequest(specificRequestId)
    console.log(`Processed ${specificRequestId}`)
    return
  }

  do {
    const next = await findNextQueuedRequest()
    if (!next) {
      if (once) {
        console.log('No queued requests found.')
        return
      }
      console.log('No queued requests found. Sleeping for 30s...')
      await sleep(30_000)
      continue
    }

    console.log(`Processing ${next.id}...`)
    try {
      await processRequest(next.id)
      console.log(`Completed ${next.id}`)
    } catch (error) {
      console.error(`Failed ${next.id}:`, error.message)
      if (once) process.exitCode = 1
    }

    if (once) return
  } while (true)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
