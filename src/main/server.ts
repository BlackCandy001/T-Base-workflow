import { app } from 'electron'
import { startBackend } from './elara/start'
import path from 'path'

export async function setupServer() {
  const dbPath = path.join(app.getPath('userData'), 'elara.sqlite')
  
  try {
    await startBackend({ dbPath })
    console.log('Elara Backend integrated successfully')
  } catch (error) {
    console.error('Failed to start Elara Backend:', error)
    throw error
  }
}
